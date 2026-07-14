// app/api/film/approve — the family's yes.
// POST { job, t, slug } (form or JSON) → the film joins the tape shelf.
// Token-gated by the job's own approve_token; idempotent; nothing hard-deleted.
import { NextRequest, NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabaseServer";
import { approveFilm } from "@/lib/film";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  const ip = clientIp(req);
  const { allowed } = rateLimit(`film-approve:${ip}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const ct = req.headers.get("content-type") || "";
  let job = "", token = "", slug = "", asForm = false;
  if (ct.includes("form")) {
    const f = await req.formData();
    job = String(f.get("job") || "");
    token = String(f.get("t") || "");
    slug = String(f.get("slug") || "");
    asForm = true;
  } else {
    const b = await req.json().catch(() => ({}));
    job = String(b.job || "");
    token = String(b.t || "");
    slug = String(b.slug || "");
  }
  if (!job || !token) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const r = await approveFilm(job, token);
  if (asForm) {
    const s = r.slug || slug;
    const back = new URL(
      `/film/${encodeURIComponent(s)}?t=${encodeURIComponent(token)}${r.ok ? "&approved=1" : ""}`,
      req.nextUrl.origin
    );
    return NextResponse.redirect(back, 303);
  }
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
