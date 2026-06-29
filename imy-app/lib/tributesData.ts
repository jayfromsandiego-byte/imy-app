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
  "tribute_memories(author_name,relation,body,status,photo_url)," +
  "tribute_loved_things(label,motif_key,note,sort)," +
  "tribute_service(starts_at,venue,address,charity_name)";

const firstName = (n: string) => (n || "").trim().split(/\s+/)[0] || n || "Them";
const dateOnly = (s?: string | null) => (s ? String(s).slice(0, 10) : undefined);
const bySort = (a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0);

function rowToTribute(r: any): Tribute {
  const photos = (r.tribute_photos || []).slice().sort(bySort);
  const lovedThings = (r.tribute_loved_things || []).slice().sort(bySort);
  return {
    slug: r.slug || undefined,
    fullName: r.loved_one_name || "",
    birth: dateOnly(r.born_on),
    passing: dateOnly(r.died_on),
    place: r.place || undefined,
    story: r.story || undefined,
    quote: r.portrait_quote || undefined,
    candleCount: r.candle_count ?? 0,
    tier: r.tier || "free",
    theme: r.theme || undefined,
    motif: r.motif || undefined,
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
      .map((m: any) => ({ text: m.body, name: m.author_name, rel: m.relation || "", photos: m.photo_url ? [m.photo_url] : undefined })),
    lovedThings: lovedThings.map((l: any) => ({ label: l.label, motifKey: l.motif_key, note: l.note })),
    service: r.tribute_service
      ? { date: dateOnly(r.tribute_service.starts_at), place: r.tribute_service.venue, address: r.tribute_service.address, charity: r.tribute_service.charity_name }
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
