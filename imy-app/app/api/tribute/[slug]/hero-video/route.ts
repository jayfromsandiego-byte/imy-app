// POST /api/tribute/[slug]/hero-video — the family chooses the hero's scene
// (July 29). Guarded by the same owner door the Archive uses: a signed-in
// user whose owner_id or owner_email matches the tribute. Visitors who tap
// the on-page picker still preview a scene in their own browser; only the
// owner's choice is written here for everyone.
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { HERO_BACKGROUNDS } from "@/lib/heroBackgrounds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "signed_out" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const slot = String((body && body.slot) || "").trim();
  if (!HERO_BACKGROUNDS.some((b) => b.id === slot)) {
    return NextResponse.json({ ok: false, error: "unknown_slot" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: t } = await db
    .from("tributes")
    .select("id,owner_id,owner_email")
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!t) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const owns = t.owner_id === user.id || (t.owner_email && t.owner_email === user.email);
  if (!owns) return NextResponse.json({ ok: false, error: "not_yours" }, { status: 403 });

  const { error } = await db.from("tributes").update({ hero_video_slot: slot }).eq("id", t.id);
  if (error) return NextResponse.json({ ok: false, error: "not_saved" }, { status: 500 });
  return NextResponse.json({ ok: true, slot });
}
