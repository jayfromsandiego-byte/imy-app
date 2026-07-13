// GET /api/cron/year-letters — runs daily via Vercel Cron (see vercel.json).
// The Year Letter (Plus keepsake · July 12): once a year, on the day the family
// chose — or their loved one's birthday when no day was chosen — one quiet
// email: what the year held. Never twice in a year, never to a resting page,
// never to a free page (it is a Plus promise).
//
// Guarded by CRON_SECRET (Vercel sends it as a Bearer token automatically).
// Silent no-op when Supabase or Resend are unconfigured.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { emailConfigured, sendYearLetterEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!supabaseConfigured || !emailConfigured) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  // Today, where the studio keeps its mornings.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // YYYY-MM-DD
  const md = today.slice(5); // MM-DD
  const year = Number(today.slice(0, 4));

  let scanned = 0;
  let sent = 0;

  try {
    const db = supabaseAdmin();
    const { data: rows } = await db
      .from("tributes")
      .select("id,slug,loved_one_name,owner_email,tier,born_on,created_at,year_letter_md,year_letter_last_year,candle_count,flower_count")
      .in("tier", ["plus", "heirloom"])
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(2000);

    for (const t of rows || []) {
      scanned += 1;
      if (!t.owner_email || !t.slug) continue;
      const chosen =
        (t.year_letter_md && /^\d{2}-\d{2}$/.test(t.year_letter_md) && t.year_letter_md) ||
        (t.born_on && String(t.born_on).slice(5, 10)) ||
        (t.created_at && String(t.created_at).slice(5, 10)) ||
        "";
      if (chosen !== md) continue;
      if (t.year_letter_last_year === year) continue; // once a year, kept honestly

      // What the year held: memories welcomed in the last twelve months.
      const since = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
      const { count: memCount } = await db
        .from("tribute_memories")
        .select("id", { count: "exact", head: true })
        .eq("tribute_id", t.id)
        .eq("status", "approved")
        .is("deleted_at", null)
        .gte("created_at", since);

      const ok = await sendYearLetterEmail(t.owner_email, t.loved_one_name || "them", t.slug, {
        memories: memCount ?? 0,
        flowers: t.flower_count ?? 0,
        candles: t.candle_count ?? 0,
      });
      if (ok) {
        sent += 1;
        await db.from("tributes").update({ year_letter_last_year: year }).eq("id", t.id);
      }
      if (sent >= 50) break; // a gentle daily ceiling
    }
  } catch {
    /* best-effort — tomorrow comes anyway */
  }

  return NextResponse.json({ ok: true, scanned, sent });
}
