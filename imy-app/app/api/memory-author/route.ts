// POST /api/memory-author — a returning visitor's kept identity (0030).
// The identity sheet asks with the email they typed; if that person has
// introduced themselves before, their name, relation, and photo come home so
// they never fill the sheet twice. Narrow on purpose: exactly three fields,
// nothing else from the row, never the email back out, and rate-limited like
// every public door. The email remains what it always was — the persistence
// key, kept private to the family, never displayed publicly.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const ip = clientIp(req);
  const { allowed } = rateLimit(`memory-author:${ip}`, 20, 10 * 60_000);
  if (!allowed) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "bad_email" }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("memory_authors")
      .select("name, relation, avatar_url")
      .eq("email", email)
      .maybeSingle();
    if (!data) return NextResponse.json({ ok: true, author: null });
    return NextResponse.json({
      ok: true,
      author: {
        name: data.name || "",
        relation: data.relation || "",
        // The avatar passes the same https expectation it was stored under.
        avatarUrl: data.avatar_url && /^https:\/\//.test(data.avatar_url) ? data.avatar_url : "",
      },
    });
  } catch {
    // A database from before 0030 has nothing to restore — the sheet simply
    // asks the way it always did.
    return NextResponse.json({ ok: true, author: null });
  }
}
