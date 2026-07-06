// POST /api/tribute/[slug]/candle — light a candle (public, truthful, atomic).
// Increments tributes.candle_count via the light_candle() SQL function and
// returns the new count. A soft per-IP/slug rate limit guards against bursts;
// the count only ever moves when someone actually lights a candle.
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
  const { allowed } = rateLimit(`candle:${ip}:${slug}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const { data, error } = await supabaseAdmin().rpc("light_candle", { p_slug: slug });
    if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
    if (data === null || data === undefined) {
      // No published tribute matched this slug.
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, count: Number(data) });
  } catch {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
