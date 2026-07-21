#!/usr/bin/env python3
"""worker — claims film_jobs, weaves films, stores them, and writes home.

Loop: requeue stale renders → claim the oldest queued job → read the tribute →
build the film spec (mirroring lib/renderTribute.ts chapter logic) → render →
upload film + poster → mark ready → supersede older unapproved films → email
the keeper. One job at a time; the smallest box is enough.

Nothing here approves anything. The film waits for the family.

Env:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY[_V2]     (required)
  R2_* (see storage.py)                            (optional — wakes R2)
  RESEND_API_KEY, EMAIL_FROM                       (optional — wakes the letter)
  SITE_URL          default https://imissyoumemorial.com
  POLL_SECONDS      default 20
  RUN_ONCE=1        process at most one job, then exit (CI / sandbox tests)
"""
import os, socket, sys, time, tempfile, traceback
from datetime import datetime, timezone

def now_iso():
    return datetime.now(timezone.utc).isoformat()

import imy_api as db
import storage
import email_notify
import health
from render_film import ASSETS, render

SITE = (os.environ.get("SITE_URL") or "https://imissyoumemorial.com").rstrip("/")
POLL = int(os.environ.get("POLL_SECONDS", "20"))
WORKER_ID = (os.environ.get("WORKER_ID") or socket.gethostname() or "film-worker")[:120]


def validate_configuration():
    missing = []
    if not db.URL:
        missing.append("SUPABASE_URL")
    if not db.KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY_V2")
    for name in ("Besley.ttf", "Besley-Italic.ttf", "SometypeMono.ttf", "wreath.png", "gymnopedie-1.flac"):
        if not os.path.exists(os.path.join(ASSETS, name)):
            missing.append(f"asset:{name}")
    if missing:
        raise RuntimeError("worker configuration missing " + ", ".join(missing))


def heartbeat(state, job_id=None, detail=None):
    """Best-effort liveness in Supabase; never let telemetry cost a film."""
    try:
        db.upsert("film_worker_heartbeats", {
            "worker_id": WORKER_ID,
            "state": state,
            "current_job_id": job_id,
            "detail": (str(detail or "")[:300] or None),
            "last_seen_at": now_iso(),
        }, "worker_id")
    except Exception:
        pass


TRIBUTE_SELECT = (
    "id,slug,loved_one_name,born_on,died_on,place,pronouns,tier,owner_email,placements,"
    "tribute_photos(id,url,caption,sort,deleted_at),"
    "tribute_videos(id,url,caption,sort,kind,deleted_at),"
    "tribute_chapters(id,title,sort,deleted_at),"
    "tribute_timeline(id,year,title,sort,chapter_id,deleted_at)"
)

POS = {"he": "his", "she": "her"}


def year_of(d):
    s = str(d or "")
    return s[:4] if len(s) >= 4 and s[:4].isdigit() else ""


def years_line(born, died):
    a, b = year_of(born), year_of(died)
    if a and b: return f"{a} to {b}"
    return a or b or ""


def chapter_years(moments):
    ys = sorted(m["year"] for m in moments if str(m.get("year") or "").strip().isdigit())
    if not ys: return "in moments"
    return ys[0] if ys[0] == ys[-1] else f"{ys[0]} to {ys[-1]}"


def chrono(moments):
    def key(im):
        i, m = im
        y = str(m.get("year") or "").strip()
        return (int(y) if y.isdigit() else 10**9, i)
    return [m for _, m in sorted(enumerate(moments), key=lambda im: key(im))]


def direct_file(url):
    u = (url or "").split("?")[0].lower()
    return u.endswith((".mp4", ".webm", ".mov", ".m4v"))


def build_spec(t, job):
    photos = sorted([p for p in (t.get("tribute_photos") or []) if not p.get("deleted_at") and p.get("url")],
                    key=lambda p: p.get("sort") or 0)
    if not photos:
        raise ValueError("not-enough-photos")

    by_id = {p["id"]: p for p in photos if p.get("id")}
    pl = t.get("placements") or {}
    ch_assign = pl.get("chapters") or {}

    def moment_photo(m):
        for pid in (ch_assign.get(m.get("id") or "", []) or []):
            if pid in by_id:
                return by_id[pid]
        return None

    timeline = [m for m in (t.get("tribute_timeline") or []) if not m.get("deleted_at")]
    chapter_rows = sorted([c for c in (t.get("tribute_chapters") or [])
                           if not c.get("deleted_at") and str(c.get("title") or "").strip()],
                          key=lambda c: c.get("sort") or 0)

    chapters, placed_photo_ids = [], set()
    if timeline and chapter_rows:
        for c in chapter_rows:
            moments = chrono([m for m in timeline if m.get("chapter_id") == c["id"]])
            ph = []
            for m in moments:
                p = moment_photo(m)
                if p and p["id"] not in placed_photo_ids:
                    ph.append({"url": p["url"], "cap": p.get("caption") or ""})
                    placed_photo_ids.add(p["id"])
            if ph:
                chapters.append({"title": str(c["title"]).strip(), "yrs": chapter_years(moments), "photos": ph})

    loose = [{"url": p["url"], "cap": p.get("caption") or ""}
             for p in photos if p.get("id") not in placed_photo_ids]

    videos = sorted([v for v in (t.get("tribute_videos") or [])
                     if not v.get("deleted_at") and v.get("url")
                     and (v.get("kind") or "tape") == "tape" and direct_file(v.get("url"))],
                    key=lambda v: v.get("sort") or 0)

    tier = (t.get("tier") or "free").lower()
    variant = job.get("variant") or "auto"
    if variant == "auto":
        variant = "full" if tier in ("plus", "heirloom") else "teaser"

    pronouns = t.get("pronouns")
    return {
        "name": t.get("loved_one_name") or "",
        "first": (t.get("loved_one_name") or "").strip().split(" ")[0] or "them",
        "years": years_line(t.get("born_on"), t.get("died_on")),
        "place": t.get("place") or "",
        "slug": t.get("slug") or "",
        "pos": POS.get(pronouns, "their"),
        "chapters": chapters,
        "photos": loose,
        "clips": [v["url"] for v in videos],
        "portrait": photos[0]["url"],
        "variant": variant,
        "music": job.get("music") or "gymnopedie-1",
    }


def auto_place(t, jid, spec, film_url):
    """The $97 promise: a paid page receives the whole film the moment it is
    woven — no approval step between a family and what they paid for. The
    letter says it is on the page; the film room can re-weave it or take it
    down any time. Free pages keep the approval moment (their films are the
    invitation, and free videos rest anyway). Returns the video row id."""
    tier = (t.get("tier") or "free").lower()
    if spec["variant"] != "full" or tier not in ("plus", "heirloom"):
        return None
    # the previous film steps aside — rested, never deleted
    olds = db.select("film_jobs",
                     f"tribute_id=eq.{t['id']}&status=eq.approved&deleted_at=is.null&select=id,video_id")
    for o in olds or []:
        if o.get("video_id"):
            db.patch("tribute_videos", f"id=eq.{o['video_id']}", {"deleted_at": now_iso()})
        db.patch("film_jobs", f"id=eq.{o['id']}", {"status": "superseded"})
    vid = db.insert("tribute_videos", {
        "tribute_id": t["id"], "url": film_url,
        "caption": f"The film of {spec['pos']} life", "sort": 999, "kind": "film",
    })
    video_id = vid[0]["id"]
    db.patch("film_jobs", f"id=eq.{jid}",
             {"status": "approved", "approved_at": now_iso(), "video_id": video_id})
    return video_id


def process(job):
    jid = job["id"]
    health.mark_job(jid)
    heartbeat("rendering", jid)
    print(f"[job {jid[:8]}] claimed · tribute {job['tribute_id'][:8]} · variant {job.get('variant')}")
    rows = db.select("tributes", f"id=eq.{job['tribute_id']}&select={TRIBUTE_SELECT}")
    if not rows:
        db.patch("film_jobs", f"id=eq.{jid}", {"status": "failed", "error": "tribute-not-found",
                                               "finished_at": now_iso()})
        health.mark_error("tribute-not-found")
        heartbeat("failed", detail="tribute-not-found")
        email_notify.send_ops_alert(jid, "tribute-not-found")
        return
    t = rows[0]
    try:
        spec = build_spec(t, job)
        with tempfile.TemporaryDirectory(prefix="filmout-") as out_dir:
            film, poster, dur = render(spec, out_dir)
            base = f"films/{job['tribute_id']}/{jid}"
            film_url = storage.upload(film, f"{base}.mp4", "video/mp4")
            poster_url = storage.upload(poster, f"{base}.jpg", "image/jpeg")
        db.patch("film_jobs", f"id=eq.{jid}", {
            "status": "ready", "film_url": film_url, "poster_url": poster_url,
            "duration_seconds": dur, "rendered_variant": spec["variant"],
            "finished_at": now_iso(), "error": None,
        })
        # older films that were never approved step aside for the new weave
        db.patch("film_jobs",
                 f"tribute_id=eq.{job['tribute_id']}&status=eq.ready&id=neq.{jid}",
                 {"status": "superseded"})
        placed = auto_place(t, jid, spec, film_url)
        if placed:
            try:
                db.patch(
                    "orders",
                    f"tribute_id=eq.{t['id']}&status=eq.paid&fulfillment_status=in.(processing,waiting_on_family,needs_attention)",
                    {"fulfillment_status": "ready", "fulfillment_error": None, "fulfilled_at": now_iso()},
                )
            except Exception:
                pass
        sent = email_notify.send_film_ready(
            t.get("owner_email") or "", spec["first"], spec["pos"], spec["slug"],
            job["approve_token"], placed=bool(placed))
        notification = "sent" if sent else ("failed" if email_notify.configured else "not_configured")
        try:
            db.patch("film_jobs", f"id=eq.{jid}", {
                "notification_status": notification,
                "notified_at": now_iso() if sent else None,
            })
        except Exception:
            pass
        if notification == "failed":
            email_notify.send_ops_alert(jid, "film-ready-email-failed")
        health.mark_poll()
        heartbeat("idle")
        print(f"[job {jid[:8]}] {'placed on the page' if placed else 'ready'} · {dur}s"
              f" · {spec['variant']} · email={notification}")
    except ValueError as ve:
        error = str(ve)
        if error == "not-enough-photos":
            db.patch("film_jobs", f"id=eq.{jid}", {
                "status": "waiting_for_photos", "error": error, "finished_at": now_iso()
            })
            try:
                db.patch(
                    "orders",
                    f"tribute_id=eq.{job['tribute_id']}&status=eq.paid&fulfillment_status=eq.processing",
                    {"fulfillment_status": "waiting_on_family", "fulfillment_error": "more-photos-needed"},
                )
            except Exception:
                pass
            health.mark_poll()
            heartbeat("idle", detail="waiting-for-photos")
            print(f"[job {jid[:8]}] waiting · not enough photographs yet")
        else:
            attempts = job.get("attempts") or 1
            status = "failed" if attempts >= 3 else "queued"
            db.patch("film_jobs", f"id=eq.{jid}", {"status": status, "error": error[:500]})
            if status == "failed":
                try:
                    db.patch(
                        "orders",
                        f"tribute_id=eq.{job['tribute_id']}&status=eq.paid&fulfillment_status=eq.processing",
                        {"fulfillment_status": "needs_attention", "fulfillment_error": error[:240]},
                    )
                except Exception:
                    pass
                email_notify.send_ops_alert(jid, error)
            health.mark_error(error)
            heartbeat(status, detail=error)
            print(f"[job {jid[:8]}] {status} after media error (attempt {attempts})")
    except Exception as e:
        traceback.print_exc()
        attempts = job.get("attempts") or 1
        status = "failed" if attempts >= 3 else "queued"
        db.patch("film_jobs", f"id=eq.{jid}", {"status": status, "error": str(e)[:500]})
        if status == "failed":
            try:
                db.patch(
                    "orders",
                    f"tribute_id=eq.{job['tribute_id']}&status=eq.paid&fulfillment_status=eq.processing",
                    {"fulfillment_status": "needs_attention", "fulfillment_error": str(e)[:240]},
                )
            except Exception:
                pass
            email_notify.send_ops_alert(jid, str(e))
        health.mark_error(str(e))
        heartbeat(status, detail=str(e))
        print(f"[job {jid[:8]}] {status} after error (attempt {attempts})")


def main():
    once = os.environ.get("RUN_ONCE") == "1"
    validate_configuration()
    health.start()
    health.mark_poll()
    heartbeat("starting")
    print(f"film-worker awake · storage={'r2' if storage.r2_configured else 'supabase'} · site={SITE}")
    while True:
        try:
            db.rpc("requeue_stale_film_jobs")
            claimed = db.rpc("claim_film_job")
            health.mark_poll()
            heartbeat("idle")
            if claimed:
                process(claimed[0])
                if once:
                    return
                continue
        except Exception as exc:
            traceback.print_exc()
            health.mark_error(str(exc))
            heartbeat("error", detail=str(exc))
        if once:
            print("queue quiet · nothing to weave")
            return
        time.sleep(POLL)


if __name__ == "__main__":
    main()
