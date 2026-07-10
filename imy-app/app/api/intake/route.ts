// POST /api/intake — the Keepsake Letter's seal. Writes a PUBLISHED tribute in one
// request (instant generation, no manual step), reserves a unique slug, and saves
// every child the letter collected: timeline moments, loved things, photos, videos,
// the kept voice, the small things, the service, and the first memory. Returns the
// tribute id + slug so the Plus path can hop straight into Stripe checkout.
// Falls back to Airtable if Supabase env is absent (keeps the old MVP alive).
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { createRecord } from "@/lib/airtable";
import { sendSealEmail } from "@/lib/email";

export const runtime = "nodejs";

const S = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max) || null;
const URLish = (v: unknown, max = 600) => (/^https?:\/\//.test(String(v || "")) ? String(v).slice(0, max) : null);

function slugify(s: string) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 60);
}
function token() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }

  // ── Required: a name. Everything else is optional — skipping is an answer. ──
  const name = S(body.fullName, 120);
  if (!name) return NextResponse.json({ ok: false, error: "A name is required." }, { status: 400 });

  let slug = slugify(String(body.slug || name));
  if (!slug) slug = `tribute-${Math.floor(1000 + Math.random() * 9000)}`;
  const email = S(body.email, 200);

  const visibilityRaw = String(body.visibility || "public").toLowerCase();
  const visibility = ["public", "unlisted", "private"].includes(visibilityRaw) ? visibilityRaw : "public";

  const pronounsRaw = String(body.pronouns || "").toLowerCase();
  const pronouns = ["he", "she", "they"].includes(pronounsRaw) ? pronounsRaw : null;

  // Fallback: no Supabase env yet → Airtable-only (keeps the live MVP working).
  if (!supabaseConfigured) {
    try {
      await createRecord("Tributes", { Slug: slug, "Loved One": name, "Customer Email": email, Story: body.story, Status: "New", Tier: "Free" });
    } catch { /* non-fatal */ }
    return NextResponse.json({ ok: true, slug, url: `https://${slug}.imissyoumemorial.com` });
  }

  const db = supabaseAdmin();

  // Reserve a unique slug (the letter live-checks, this is the authority).
  const base = slug; let n = 1;
  while (true) {
    const { data } = await db.from("tributes").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${++n}`;
  }

  const claim = token();

  // Years must be plausible (fix 8): 1900 through this year, passing not before
  // birth. An implausible date is set aside (null) rather than failing the seal —
  // the family can set it right in their study; the letter validates inline too.
  const nowYear = new Date().getFullYear();
  const plausibleDate = (v: string): string | null => {
    const s = S(v, 10);
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const y = Number(s.slice(0, 4));
    return y >= 1900 && y <= nowYear ? s : null;
  };
  let bornOn = plausibleDate(body.birth);
  let diedOn = plausibleDate(body.passing);
  if (bornOn && diedOn && diedOn < bornOn) diedOn = null;

  const { data: trib, error } = await db.from("tributes").insert({
    slug,
    loved_one_name: name,
    aka: S(body.aka, 80),
    born_on: bornOn,
    died_on: diedOn,
    place: S(body.place, 120),
    story: S(body.story, 8000),
    obituary: S(body.obituary, 12000),
    portrait_quote: S(body.quote, 300),
    theme: "wreath",
    motif: null,
    tier: "free", // Plus wakes via the Stripe webhook, same second payment lands
    status: "published",
    visibility,
    pronouns,
    owner_email: email,
    claim_token: claim,
    candle_count: 0,
    flower_count: 1, // the family's own first flower, laid by the seal
  }).select("id").single();

  if (error || !trib) {
    return NextResponse.json({ ok: false, error: "Could not create the tribute." }, { status: 500 });
  }
  const tid = trib.id;

  // ── Children (each best-effort; a partial letter still publishes) ──
  const lovedThings = Array.isArray(body.lovedThings) ? body.lovedThings.slice(0, 12) : [];
  if (lovedThings.length) {
    await db.from("tribute_loved_things").insert(
      lovedThings.map((l: any, i: number) => ({
        tribute_id: tid, label: S(l.label ?? l, 60) || "", motif_key: S(l.motifKey, 40), sort: i,
      })).filter((r: any) => r.label)
    );
  }

  // The chapters of the life (0017), named in the letter. Distinct titles only,
  // in the family's order; each moment may name the chapter it belongs to.
  const chapterTitles: string[] = Array.from(new Set(
    (Array.isArray(body.chapters) ? body.chapters : [])
      .map((c: any) => (S(c, 80) || "").trim())
      .filter(Boolean)
  )).slice(0, 12) as string[];
  const chapterIdByTitle: Record<string, string> = {};
  if (chapterTitles.length) {
    const { data: chIns } = await db.from("tribute_chapters")
      .insert(chapterTitles.map((title, i) => ({ tribute_id: tid, title, sort: i })))
      .select("id,title");
    for (const c of chIns || []) chapterIdByTitle[String(c.title)] = String(c.id);
  }

  const moments = Array.isArray(body.moments) ? body.moments.slice(0, 40) : [];
  // A moment's year must be plausible (fix 8): 1900 through this year.
  // Not bound to the life — timelines legitimately hold family history from
  // before a birth. An implausible year is quietly set aside; the words
  // are always kept, never the junk number.
  const momentYear = (v: any): string => {
    const s = (S(v, 12) || "").trim();
    if (!/^\d{4}$/.test(s)) return "";
    const y = Number(s);
    return y >= 1900 && y <= nowYear ? s : "";
  };
  // Each moment may carry its own photograph (July 10): kept alongside so the
  // inserted row ids can be paired with photo rows further down.
  const tlRows = moments
    .map((m: any, i: number) => ({
      row: {
        tribute_id: tid, year: momentYear(m.year), title: S(m.title, 140) || S(m.body, 140) || "", body: S(m.body, 600), sort: i,
        chapter_id: chapterIdByTitle[(S(m.chapter, 80) || "").trim()] || null,
      },
      photoUrl: URLish(m.photoUrl) || "",
    }))
    .filter((r: any) => r.row.title);
  let tlIns: any[] = [];
  if (tlRows.length) {
    const { data } = await db.from("tribute_timeline").insert(tlRows.map((r: any) => r.row)).select("id");
    tlIns = data || [];
  }

  const photos: string[] = (Array.isArray(body.photos) ? body.photos : []).map((u: any) => URLish(u)).filter(Boolean).slice(0, 400) as string[];
  const cover = URLish(body.coverPhotoUrl);
  const allPhotos = cover ? [cover, ...photos.filter((u) => u !== cover)] : photos;
  if (allPhotos.length) {
    await db.from("tribute_photos").insert(allPhotos.map((url, i) => ({ tribute_id: tid, url, sort: i })));
  }

  // A moment's own photograph (July 10): the letter attached it, the page
  // shows it beside its moment. Each becomes a photo row, then the placement
  // map points the moment at it — the renderer does the rest.
  const momentPhotoPairs = tlRows
    .map((r: any, i: number) => ({ url: r.photoUrl, tlId: tlIns[i]?.id }))
    .filter((p: any) => p.url && p.tlId);
  if (momentPhotoPairs.length) {
    const { data: phIns } = await db.from("tribute_photos")
      .insert(momentPhotoPairs.map((p: any, i: number) => ({ tribute_id: tid, url: p.url, sort: allPhotos.length + i })))
      .select("id");
    const chaptersMap: Record<string, string[]> = {};
    momentPhotoPairs.forEach((p: any, i: number) => {
      const ph = phIns?.[i]?.id;
      if (ph) chaptersMap[String(p.tlId)] = [String(ph)];
    });
    if (Object.keys(chaptersMap).length) {
      await db.from("tributes").update({ placements: { chapters: chaptersMap } }).eq("id", tid);
    }
  }

  const videos: string[] = (Array.isArray(body.videos) ? body.videos : []).map((u: any) => URLish(u)).filter(Boolean).slice(0, 40) as string[];
  if (videos.length) {
    await db.from("tribute_videos").insert(videos.map((url, i) => ({ tribute_id: tid, url, sort: i })));
  }

  const voiceUrl = URLish(body.voiceUrl);
  if (voiceUrl) {
    await db.from("tribute_audio").insert({ tribute_id: tid, url: voiceUrl, kind: "voice", caption: "A voice to keep" });
  }

  // The small things: a song, and anything else the letter gathered as label/value pairs.
  const details: Array<{ k: string; v: string }> = [];
  if (S(body.song, 140)) details.push({ k: "A song they loved", v: S(body.song, 140)! });
  (Array.isArray(body.details) ? body.details.slice(0, 12) : []).forEach((d: any) => {
    const k = S(d.k ?? d.label, 60); const v = S(d.v ?? d.value, 200);
    if (k && v) details.push({ k, v });
  });
  if (details.length) {
    await db.from("tribute_detail_cards").insert(details.map((d, i) => ({ tribute_id: tid, label: d.k, value: d.v, sort: i })));
  }

  const svc = body.service || {};
  if (S(svc.venue, 160) || S(svc.startsAt, 40) || S(svc.charity, 120)) {
    await db.from("tribute_service").insert({
      tribute_id: tid,
      starts_at: S(svc.startsAt, 40),
      venue: S(svc.venue, 160),
      address: S(svc.address, 240),
      charity_name: S(svc.charity, 120),
      charity_url: URLish(svc.charityUrl, 300),
    });
  }

  if (body.firstMemory && body.firstMemory.body) {
    await db.from("tribute_memories").insert({
      tribute_id: tid, author_name: S(body.firstMemory.author_name, 80) || "Family",
      relation: S(body.firstMemory.relation, 60), body: String(body.firstMemory.body).slice(0, 2000), status: "approved",
    });
  }

  // Best-effort Airtable mirror during cutover.
  try {
    await createRecord("Tributes", { Slug: slug, "Loved One": name, "Customer Email": email, Story: body.story, Status: "New", Tier: "Free" });
  } catch { /* non-fatal */ }

  // The promised email: their page is ready, and this address is the key back
  // to it. Best-effort — a failed send never blocks the seal. No-op until
  // RESEND_API_KEY exists.
  if (email) {
    try { await sendSealEmail(email, name, slug); } catch { /* non-fatal */ }
  }

  return NextResponse.json({
    ok: true, slug, tributeId: tid,
    url: `https://${slug}.imissyoumemorial.com`,
    path: `/sites/${slug}`,
    claimToken: claim,
  });
}
