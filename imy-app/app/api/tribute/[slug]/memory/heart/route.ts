// POST /api/tribute/[slug]/memory/heart — heart a memory on the wall (public, truthful, atomic).
// The wall's counterpart to lay_flower(): moves tribute_memories.hearts by ±1 via the
// heart_memory() SQL function (migration 0009) and returns the new count. A heart can be
// quietly taken back ({ on: false }); the count never goes below zero, and it only moves
// for an approved memory on a published page.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const memoryId = String(body?.memoryId || "");
  if (!UUID.test(memoryId)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const delta = body?.on === false ? -1 : 1;

  const ip = clientIp(req);
  const { allowed } = rateLimit(`heart:${ip}:${slug}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const { data, error } = await supabaseAdmin().rpc("heart_memory", {
      p_slug: slug,
      p_memory_id: memoryId,
      p_delta: delta,
    });
    if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
    if (data === null || data === undefined) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, count: Number(data) });
  } catch {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
