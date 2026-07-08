// lib/tributesData.ts — read a tribute from Supabase (Airtable fallback during cutover),
// mapped to the renderTribute Tribute shape. Supabase is primary; Airtable is the safety net.
import { supabaseAdmin, supabaseConfigured } from "./supabaseServer";
import { getTributeBySlug as airtableBySlug } from "./airtable";
import { recordToTribute, type Tribute } from "./renderTribute";

const SELECT =
  "*," +
  "tribute_detail_cards(label,value,sort)," +
  "tribute_timeline(year,title,body,sort)," +
  "tribute_photos(url,caption,sort)," +
  "tribute_videos(url,caption,sort)," +
  "tribute_memories(id,author_name,relation,body,status,photo_url,hearts,created_at," +
  "tribute_memory_comments(author_name,relation,body,status,created_at))," +
  "tribute_loved_things(label,motif_key,note,sort)," +
  "tribute_audio(url,kind)," +
  "tribute_service(starts_at,venue,address,charity_name,charity_url)";

const firstName = (n: string) => (n || "").trim().split(/\s+/)[0] || n || "Them";
const dateOnly = (s?: string | null) => (s ? String(s).slice(0, 10) : undefined);
const bySort = (a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0);

/** The human time from a stored starts_at ("2026-06-13 11:00 AM" or ISO "…T18:00:00+00:00"). */
function humanTime(startsAt?: string | null): string | undefined {
  const tail = String(startsAt || "").slice(10).trim().replace(/^T/, "");
  if (!tail) return undefined;
  if (/am|pm/i.test(tail)) return tail.replace(/:\d{2}(\s*[ap]m)/i, "$1");
  const m = tail.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  let h = parseInt(m[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
}

function rowToTribute(r: any): Tribute {
  const photos = (r.tribute_photos || []).slice().sort(bySort);
  const lovedThings = (r.tribute_loved_things || []).slice().sort(bySort);
  return {
    slug: r.slug || undefined,
    fullName: r.loved_one_name || "",
    aka: r.aka || undefined,
    birth: dateOnly(r.born_on),
    passing: dateOnly(r.died_on),
    place: r.place || undefined,
    story: r.story || undefined,
    quote: r.portrait_quote || undefined,
    candleCount: r.candle_count ?? 0,
    flowerCount: r.flower_count ?? 0,
    sponsor: (r.sponsor_name || r.sponsor_message)
      ? { name: r.sponsor_name || undefined, photoUrl: r.sponsor_photo_url || undefined, message: r.sponsor_message || undefined }
      : undefined,
    voiceUrl: ((r.tribute_audio || []).find((a: any) => a.kind === "voice") || {}).url || undefined,
    videos: (r.tribute_videos || []).slice().sort(bySort).map((v: any) => ({ url: v.url, cap: v.caption || undefined })).filter((v: any) => v.url),
    tier: r.tier || "free",
    theme: r.theme || undefined,
    motif: r.motif || undefined,
    visibility: r.visibility || undefined,
    status: r.status || undefined,
    pronouns: r.pronouns || undefined,
    coverPhoto: photos[0]?.url || undefined,
    portrait: photos[0]?.url || undefined,
    message: r.message_from_them ? { text: r.message_from_them, sign: firstName(r.loved_one_name) } : undefined,
    details: (r.tribute_detail_cards || []).slice().sort(bySort).map((d: any) => ({ k: d.label, v: d.value })),
    timeline: (r.tribute_timeline || []).slice().sort(bySort).map((t: any) => ({ year: t.year, title: t.title, text: t.body })),
    photos: photos.map((p: any) => ({ url: p.url, cap: p.caption || undefined })),
    // "What they loved most" cards come from the family's chosen interests.
    loved: lovedThings.map((l: any) => ({ label: l.label })),
    reel: (r.tribute_videos || []).slice().sort(bySort).map((v: any) => ({ label: v.caption || "" })),
    memories: (r.tribute_memories || [])
      .filter((m: any) => m.status === "approved")
      .map((m: any) => ({
        id: m.id,
        text: m.body,
        name: m.author_name,
        rel: m.relation || "",
        hearts: m.hearts ?? 0,
        photos: m.photo_url ? [m.photo_url] : undefined,
        comments: (m.tribute_memory_comments || [])
          .filter((c: any) => c.status === "approved" && !c.deleted_at)
          .sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)))
          .map((c: any) => ({ name: c.author_name, rel: c.relation || "", text: c.body })),
      })),
    lovedThings: lovedThings.map((l: any) => ({ label: l.label, motifKey: l.motif_key, note: l.note })),
    service: r.tribute_service
      ? {
          date: dateOnly(r.tribute_service.starts_at),
          time: humanTime(r.tribute_service.starts_at),
          place: r.tribute_service.venue,
          address: r.tribute_service.address,
          charity: r.tribute_service.charity_name,
          charityUrl: r.tribute_service.charity_url || undefined,
        }
      : undefined,
  };
}

/** Primary read path: Supabase first, then Airtable fallback. Returns null if unknown. */
export async function getTribute(slug: string): Promise<Tribute | null> {
  if (supabaseConfigured) {
    try {
      const { data, error } = await supabaseAdmin()
        .from("tributes")
        .select(SELECT)
        .eq("slug", slug)
        .is("deleted_at", null)
        .maybeSingle();
      if (!error && data) return rowToTribute(data);
    } catch {
      /* fall through to Airtable */
    }
  }
  try {
    const rec = await airtableBySlug(slug);
    if (rec) return recordToTribute(rec);
  } catch {
    /* ignore */
  }
  return null;
}
