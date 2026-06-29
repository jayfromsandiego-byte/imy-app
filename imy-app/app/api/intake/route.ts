// POST /api/intake — onboarding submit. Writes a published tribute into Supabase
// (instant generation), reserves a unique slug, saves loved-things + a first memory
// + an optional cover photo, and best-effort mirrors to Airtable during cutover.
// Falls back to Airtable if Supabase env is absent.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { createRecord } from "@/lib/airtable";

export const runtime = "nodejs";

function slugify(s: string) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function token() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }

  const name = (body.fullName || "").toString().trim();
  let slug = slugify(body.slug || name);
  if (!slug) return NextResponse.json({ ok: false, error: "A name is required." }, { status: 400 });
  const email = (body.email || "").toString().trim() || null;
  const coverPhotoUrl = /^https?:\/\//.test(String(body.coverPhotoUrl || "")) ? String(body.coverPhotoUrl).slice(0, 600) : null;

  // Fallback: no Supabase env yet -> Airtable-only (keeps the live MVP working).
  if (!supabaseConfigured) {
    try {
      await createRecord("Tributes", { Slug: slug, "Loved One": name, "Customer Email": email, Story: body.story, Status: "New", Tier: body.tier || "Free" });
    } catch { /* non-fatal */ }
    return NextResponse.json({ ok: true, slug, url: `https://${slug}.imissyoumemorial.com` });
  }

  const db = supabaseAdmin();

  // Reserve a unique slug.
  const base = slug; let n = 1;
  while (true) {
    const { data } = await db.from("tributes").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${++n}`;
  }

  const claim = token();
  const lovedThings = Array.isArray(body.lovedThings) ? body.lovedThings.slice(0, 12) : [];
  const motif = (lovedThings[0] && lovedThings[0].motifKey) || null;

  const { data: trib, error } = await db.from("tributes").insert({
    slug,
    loved_one_name: name,
    aka: body.aka || null,
    born_on: body.birth || null,
    died_on: body.passing || null,
    place: body.place || null,
    story: body.story || null,
    portrait_quote: body.quote || null,
    theme: "the-vigil",
    motif,
    tier: body.tier || "free",
    status: "published",
    visibility: "public",
    owner_email: email,
    claim_token: claim,
    candle_count: 1,
  }).select("id").single();

  if (error || !trib) {
    return NextResponse.json({ ok: false, error: "Could not create the tribute." }, { status: 500 });
  }
  const tid = trib.id;

  if (lovedThings.length) {
    await db.from("tribute_loved_things").insert(
      lovedThings.map((l: any, idx: number) => ({ tribute_id: tid, label: String(l.label || "").slice(0, 60), motif_key: l.motifKey || null, sort: idx }))
    );
  }
  if (coverPhotoUrl) {
    await db.from("tribute_photos").insert({ tribute_id: tid, url: coverPhotoUrl, sort: 0 });
  }
  if (body.firstMemory && body.firstMemory.body) {
    await db.from("tribute_memories").insert({
      tribute_id: tid, author_name: body.firstMemory.author_name || "Family",
      relation: body.firstMemory.relation || null, body: String(body.firstMemory.body).slice(0, 2000), status: "approved",
    });
  }

  // Best-effort Airtable mirror during cutover.
  try {
    await createRecord("Tributes", { Slug: slug, "Loved One": name, "Customer Email": email, Story: body.story, Status: "New", Tier: body.tier || "Free" });
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, slug, url: `https://${slug}.imissyoumemorial.com`, claimToken: claim });
}
