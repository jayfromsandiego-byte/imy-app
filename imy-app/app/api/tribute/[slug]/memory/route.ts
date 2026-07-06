// POST /api/tribute/[slug]/memory — leave a memory (public).
// Memories are saved as "pending" and appear on the page only after the family
// welcomes them in from the dashboard. Spam is held back with three quiet guards:
// a honeypot field, length caps, and a soft per-IP rate limit. We never reject a
// grieving stranger's words for looking "wrong" — moderation is the family's, not a filter's.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { sendMemoryWaitingEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) =>
  String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug === "example" ? "eleanor" : params.slug;

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: a hidden field real people never see. If it's filled, quietly accept
  // and drop (don't tip off the bot that it was caught).
  if (clean(body.company, 100)) return NextResponse.json({ ok: true, pending: true });

  const text = clean(body.body, 2000);
  const name = clean(body.name, 80) || "A friend";
  const relation = clean(body.relation, 60) || null;
  const photoUrl = /^https:\/\//.test(String(body.photoUrl || "")) ? clean(body.photoUrl, 600) : null;
  if (text.length < 2) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const ip = clientIp(req);
  const { allowed } = rateLimit(`memory:${ip}`, 8, 5 * 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();
  const { data: trib } = await db
    .from("tributes")
    .select("id, loved_one_name, owner_email")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!trib) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { error } = await db.from("tribute_memories").insert({
    tribute_id: trib.id,
    author_name: name,
    relation,
    body: text,
    photo_url: photoUrl,
    status: "pending",
  });
  if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });

  // Nudge the caretaker when this is the FIRST memory waiting — one gentle
  // email, not one per visitor. Best-effort; no-op until Resend is configured.
  try {
    if (trib.owner_email) {
      const { count } = await db
        .from("tribute_memories")
        .select("id", { count: "exact", head: true })
        .eq("tribute_id", trib.id)
        .eq("status", "pending");
      if (count === 1) {
        await sendMemoryWaitingEmail(trib.owner_email, trib.loved_one_name || "them");
      }
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, pending: true });
}
