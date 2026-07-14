// app/api/tribute/[slug]/film — the film room's door.
// GET  ?t=<token>              → the latest weave's state (token-gated).
// POST { t, variant? }         → ask for a weave (or a re-weave). Form or JSON.
//
// The token comes from the family's own email. No token, no film — a film is
// private until the family says otherwise.
import { NextRequest, NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabaseServer";
import { filmRoom, enqueueFilm } from "@/lib/film";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const token = req.nextUrl.searchParams.get("t") || "";
  const room = await filmRoom(params.slug, token);
  if (!room) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const j = room.job;
  return NextResponse.json({
    ok: true,
    status: j.status,
    variant: j.rendered_variant || j.variant,
    filmUrl: j.film_url,
    posterUrl: j.poster_url,
    duration: j.duration_seconds,
    error: j.error,
  });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const ip = clientIp(req);
  const { allowed } = rateLimit(`film:${ip}:${params.slug}`, 6, 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const ct = req.headers.get("content-type") || "";
  let token = "", variant: "auto" | "full" | "teaser" = "auto", asForm = false;
  if (ct.includes("form")) {
    const f = await req.formData();
    token = String(f.get("t") || "");
    const v = String(f.get("variant") || "auto");
    variant = v === "full" || v === "teaser" ? v : "auto";
    asForm = true;
  } else {
    const b = await req.json().catch(() => ({}));
    token = String(b.t || "");
    const v = String(b.variant || "auto");
    variant = v === "full" || v === "teaser" ? v : "auto";
  }

  const room = await filmRoom(params.slug, token);
  if (!room) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const r = await enqueueFilm(room.tribute.id, "keeper", variant);
  if (asForm) {
    const back = new URL(`/film/${encodeURIComponent(params.slug)}?t=${encodeURIComponent(token)}`, req.nextUrl.origin);
    return NextResponse.redirect(back, 303);
  }
  return NextResponse.json({ ok: r.ok, already: r.already || false });
}
