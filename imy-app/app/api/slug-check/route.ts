// GET /api/slug-check?slug=eleanor-whitfield — live availability check for the
// letter's address chooser (Nº 13). Returns { available } plus a suggestion when
// taken. Read-only, rate-limited, never reveals anything about the page itself.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESERVED = new Set([
  "www", "app", "api", "example", "eleanor", "admin", "dashboard", "onboarding",
  "signin", "auth", "terms", "privacy", "sites", "mail", "help", "support", "blog",
]);

function slugify(s: string) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("slug") || "";
  const slug = slugify(raw);
  if (!slug || slug.length < 3) {
    return NextResponse.json({ ok: true, available: false, reason: "too_short", slug });
  }
  if (RESERVED.has(slug)) {
    return NextResponse.json({ ok: true, available: false, reason: "reserved", slug });
  }

  const ip = clientIp(req);
  const { allowed } = rateLimit(`slugcheck:${ip}`, 30, 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  if (!supabaseConfigured) {
    // Graceful: without a database we can't promise availability; intake will
    // uniquify at seal time either way.
    return NextResponse.json({ ok: true, available: true, slug, unverified: true });
  }

  const { data } = await supabaseAdmin().from("tributes").select("id").eq("slug", slug).maybeSingle();
  if (!data) return NextResponse.json({ ok: true, available: true, slug });

  const suggestion = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  return NextResponse.json({ ok: true, available: false, reason: "taken", slug, suggestion });
}
