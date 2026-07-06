// POST /api/tribute/[slug]/flower — lay a flower on the wreath (public, truthful, atomic).
// The wreath ritual's counterpart to light_candle(): increments tributes.flower_count
// via the lay_flower() SQL function (migration 0006) and returns the new count.
// Same guarantees as candles — the count only moves when someone actually lays one.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug === "example" ? "eleanor" : params.slug;

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const ip = clientIp(req);
  const { allowed } = rateLimit(`flower:${ip}:${slug}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const { data, error } = await supabaseAdmin().rpc("lay_flower", { p_slug: slug });
    if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
    if (data === null || data === undefined) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, count: Number(data) });
  } catch {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
