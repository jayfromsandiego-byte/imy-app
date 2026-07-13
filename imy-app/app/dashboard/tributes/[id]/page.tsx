import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { saveTribute, restTribute, setYearLetterDate } from "@/app/dashboard/actions";
import { pronounSet } from "@/lib/renderTribute";
import MediaManager from "@/components/MediaManager";
import PlacementsManager from "@/components/PlacementsManager";
import VideosManager from "@/components/VideosManager";
import ArrangeManager from "@/components/ArrangeManager";
import VoiceKeeper from "@/components/VoiceKeeper";

export const dynamic = "force-dynamic";

export default async function EditTribute({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect("/signin");
  const db = supabaseAdmin();
  const { data: t } = await db.from("tributes").select("*,year_letter_md").eq("id", params.id).maybeSingle();
  if (!t || (t.owner_id !== user.id && t.owner_email !== user.email)) {
    return (
      <section className="panel-head stagger">
        <p className="panel-sub">
          This tribute could not be found, or isn&rsquo;t yours to manage.{" "}
          <Link href="/dashboard">Back to your tributes</Link>
        </p>
      </section>
    );
  }
  const { data: memories } = await db
    .from("tribute_memories")
    .select("*")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const { data: photos } = await db
    .from("tribute_photos")
    .select("id,url,sort")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("sort", { ascending: true });
  const { data: voiceRow } = await db
    .from("tribute_audio")
    .select("url")
    .eq("tribute_id", t.id)
    .eq("kind", "voice")
    .maybeSingle();
  const { data: videos } = await db
    .from("tribute_videos")
    .select("id,url,caption,sort")
    .eq("tribute_id", t.id)
    .order("sort", { ascending: true });
  const { data: timeline } = await db
    .from("tribute_timeline")
    .select("id,year,title,sort,chapter_id")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("sort", { ascending: true });
  const { data: chapterRows } = await db
    .from("tribute_chapters")
    .select("id,title,sort")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("sort", { ascending: true });
  const { data: comments } = await db
    .from("tribute_memory_comments")
    .select("id,memory_id,author_name,relation,body,status,created_at")
    .eq("tribute_id", t.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const photoCount = (photos || []).length;
  const pending = (memories || []).filter((m: any) => m.status === "pending");
  const approved = (memories || []).filter((m: any) => m.status === "approved");
  const pendingComments = (comments || []).filter((c: any) => c.status === "pending");
  const pn = pronounSet(t.pronouns);
  const memoryExcerpt = (memoryId: string) => {
    const m = (memories || []).find((x: any) => x.id === memoryId);
    const body = m?.body || "";
    return body.length > 90 ? `${body.slice(0, 90)}…` : body;
  };

  function timeAgo(iso: string) {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="stagger">
      <div className="panel-head">
        <Link href="/dashboard" className="mono" style={{ fontSize: 14, textDecoration: "none" }}>
          {"←"} All tributes
        </Link>
        <div className="panel-title-row" style={{ marginTop: 8 }}>
          <svg className="sprig title-sprig" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 29c0-8 0-15 0-22" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <h1 className="panel-title">
            <span className="uline drawn">{t.loved_one_name}</span>
          </h1>
        </div>
        <p className="panel-sub mono" style={{ fontSize: 12 }}>
          {t.slug}.imissyoumemorial.com {"·"} {t.tier} {"·"} {t.status} {"·"} {photoCount || 0} photos
        </p>
      </div>

      {/* ---------- Waiting for you · one desk for every page, at /dashboard/waiting ---------- */}
      <section style={{ marginTop: 32 }}>
        <div className="panel-title-row">
          <h2 className="panel-title" style={{ fontSize: 20 }}>
            Waiting for you{pending.length + pendingComments.length > 0 ? ` · ${pending.length + pendingComments.length}` : ""}
          </h2>
        </div>
        <p className="panel-sub" style={{ marginBottom: 14 }}>
          Every memory, word, photograph, and voice now waits on a single desk, for all
          your pages together. Nothing appears on the live page until you welcome it in.
        </p>
        <Link href="/dashboard/waiting" className="btn primary" style={{ display: "inline-block", textDecoration: "none" }}>
          {pending.length + pendingComments.length > 0 ? `Read what waits · ${pending.length + pendingComments.length}` : "Open the waiting desk"}
        </Link>
        <p className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 18 }}>
          {approved.length} {approved.length === 1 ? "memory" : "memories"} shared
        </p>
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      {/* ---------- The pictures ---------- */}
      <section style={{ marginTop: 8 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>
          The pictures
        </h2>
        <p className="panel-sub" style={{ marginBottom: 20 }}>
          The first photo becomes {pn.pos} Memorial Stone and portrait.
        </p>
        <MediaManager tributeId={t.id} photos={(photos as any) || []} />
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      {/* ---------- Where each photograph lives ---------- */}
      <section style={{ marginTop: 8 }}>
        <PlacementsManager
          tributeId={t.id}
          photos={((photos as any) || []).map((p: any) => ({ id: String(p.id), url: p.url }))}
          timeline={((timeline as any) || []).map((r: any) => ({ id: String(r.id), year: r.year || "", title: r.title || "", ch: r.chapter_id ? String(r.chapter_id) : "" }))}
          chapterRows={((chapterRows as any) || []).map((c: any) => ({ id: String(c.id), title: c.title || "" }))}
          placements={(t.placements as any) || null}
          bornYear={t.born_on ? Number(String(t.born_on).slice(0, 4)) : undefined}
          diedYear={t.died_on ? Number(String(t.died_on).slice(0, 4)) : undefined}
        />
      </section>

      {/* ---------- The tape shelf ---------- */}
      <section style={{ marginTop: 20 }}>
        <VideosManager
          tributeId={t.id}
          videos={((videos as any) || []).map((v: any) => ({ id: String(v.id), url: v.url, caption: v.caption }))}
          photos={((photos as any) || []).map((p: any) => ({ id: String(p.id), url: p.url }))}
          living={(((t.placements as any) || {}).living as Record<string, string>) || {}}
          tier={t.tier || "free"}
        />
      </section>

      {/* ---------- Their voice ---------- */}
      <section style={{ marginTop: 20 }}>
        <VoiceKeeper tributeId={t.id} voiceUrl={(voiceRow as any)?.url || null} tier={t.tier || "free"} />
      </section>

      {/* ---------- The order of the rooms ---------- */}
      <section style={{ marginTop: 20 }}>
        <ArrangeManager tributeId={t.id} sections={(t.sections as any) || null} />
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      {/* ---------- Their story ---------- */}
      <section style={{ marginTop: 8 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>
          {pn.Pos} story
        </h2>
        <p className="panel-sub" style={{ marginBottom: 20 }}>
          A few core details for {pn.pos} page. Save whenever you like · nothing here is urgent.
        </p>
        <form action={saveTribute} className="story-room">
          <input type="hidden" name="id" value={t.id} />
          <label>
            <span className="field-label">Name</span>
            <input className="field-input" name="loved_one_name" defaultValue={t.loved_one_name || ""} />
          </label>
          <div className="field-row">
            <label>
              <span className="field-label">Born</span>
              <input className="field-input" type="date" name="born_on" defaultValue={t.born_on || ""} min="1900-01-01" max={new Date().toISOString().slice(0, 10)} />
            </label>
            <label>
              <span className="field-label">Passed</span>
              <input className="field-input" type="date" name="died_on" defaultValue={t.died_on || ""} min={t.born_on || "1900-01-01"} max={new Date().toISOString().slice(0, 10)} />
            </label>
          </div>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">Where they lived</span>
            <input className="field-input" name="place" defaultValue={t.place || ""} />
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">A favourite line</span>
            <input className="field-input" name="portrait_quote" defaultValue={t.portrait_quote || ""} />
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">Their story</span>
            <textarea className="field-input" name="story" defaultValue={t.story || ""} />
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <span className="field-label">The obituary · the formal notice, shown on its own quiet sheet</span>
            <textarea className="field-input" name="obituary" defaultValue={t.obituary || ""} placeholder="In loving memory… survived by… services will be held…" style={{ minHeight: 140 }} />
          </label>
          <div className="field-row">
            <label>
              <span className="field-label">Status</span>
              <select className="field-input" name="status" defaultValue={t.status}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published (live)</option>
              </select>
            </label>
            <label>
              <span className="field-label">Who can visit</span>
              <select className="field-input" name="visibility" defaultValue={t.visibility}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn primary" style={{ marginTop: 20 }}>
            Save changes
          </button>
        </form>
      </section>

      {/* ---------- The keepsakes (Plus · July 12) ---------- */}
      <section className="panel-block">
        <h2 className="panel-title" style={{ fontSize: 24 }}>The keepsakes</h2>
        {t.tier === "plus" || t.tier === "heirloom" ? (
          <>
            <p className="panel-sub" style={{ marginBottom: 16 }}>
              Two quiet things that come with Plus. Nothing here ever expires.
            </p>
            <div className="s-card full" style={{ marginBottom: 14 }}>
              <p className="sentence">
                <b>The Archive.</b> Every photograph at full resolution, every memory, every voice
                recording — arranged, with a cover. Yours, in your hands, forever.
              </p>
              <div className="card-foot">
                <a className="btn quiet" href={`/api/tribute/${t.slug}/archive`}>
                  Download the Archive
                </a>
              </div>
            </div>
            <div className="s-card full">
              <p className="sentence">
                <b>The Year Letter.</b> Once a year, on the day you choose, one quiet email — what the
                year held: new memories, flowers, candles. Leave the day empty and it arrives on {pn.pos} birthday.
              </p>
              <form action={setYearLetterDate} className="card-foot" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input type="hidden" name="id" value={t.id} />
                <input
                  className="field-input"
                  style={{ maxWidth: 140 }}
                  name="year_letter_md"
                  placeholder="MM-DD"
                  pattern="(\d{4}-)?\d{2}-\d{2}"
                  defaultValue={t.year_letter_md || ""}
                  aria-label="The Year Letter's day, as month and day"
                />
                <button type="submit" className="btn quiet">Keep this day</button>
              </form>
            </div>
          </>
        ) : (
          <p className="panel-sub">
            The Archive and the Year Letter come with Plus — along with {pn.pos} voice, living pictures,
            and the whole wall. <Link href="/dashboard/billing">Keep everything</Link>.
          </p>
        )}
      </section>

      {/* ---------- Rest this page (July 12) ---------- */}
      <section className="panel-block">
        <details>
          <summary className="panel-sub" style={{ cursor: "pointer" }}>Rest this page</summary>
          <div className="s-card full" style={{ marginTop: 12 }}>
            <p className="sentence">
              Resting takes {pn.pos} page off the public web and out of your desk&rsquo;s main list.
              Nothing is deleted — every photograph, memory, and voice stays exactly as it is,
              and you can return the page to the light whenever you wish, from the bottom of your desk.
            </p>
            <form action={restTribute} className="card-foot">
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="btn quiet">I understand · rest the page</button>
            </form>
          </div>
        </details>
      </section>
    </div>
  );
}
