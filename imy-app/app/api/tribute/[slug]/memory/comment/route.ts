// POST /api/tribute/[slug]/memory/comment — leave a word under a memory (public).
// Words are saved as "pending" and appear on the page only after the family welcomes
// them in from the dashboard — the same promise memories make. The same three quiet
// guards hold: a honeypot field, length caps, and a soft per-IP rate limit. Moderation
// is the family's, never a filter's.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  // Honeypot: quietly accept and drop.
  if (clean(body.company, 100)) return NextResponse.json({ ok: true, pending: true });

  const memoryId = String(body?.memoryId || "");
  const text = clean(body.body, 500);
  const name = clean(body.name, 80) || "A friend";
  const relation = clean(body.relation, 60) || null;
  if (!UUID.test(memoryId)) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  if (text.length < 2) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const ip = clientIp(req);
  const { allowed } = rateLimit(`comment:${ip}`, 8, 5 * 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const db = supabaseAdmin();

  // The word must land under a real, approved memory on this published page.
  const { data: trib } = await db
    .from("tributes")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!trib) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { data: mem } = await db
    .from("tribute_memories")
    .select("id")
    .eq("id", memoryId)
    .eq("tribute_id", trib.id)
    .eq("status", "approved")
    .is("deleted_at", null)
    .maybeSingle();
  if (!mem) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { error } = await db.from("tribute_memory_comments").insert({
    memory_id: memoryId,
    tribute_id: trib.id,
    author_name: name,
    relation,
    body: text,
    status: "pending",
  });
  if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });

  return NextResponse.json({ ok: true, pending: true });
}
