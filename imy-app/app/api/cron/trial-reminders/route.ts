// GET /api/cron/trial-reminders — runs daily via Vercel Cron (see vercel.json).
// Finds live trials converting in the next 12–36 hours and sends each family
// one honest reminder before the $12 charge lands. Exactly one reminder per
// trial: the window is a day wide and the job runs once a day.
//
// Guarded by CRON_SECRET (Vercel sends it as a Bearer token automatically).
// Silent no-op when Stripe or Resend are unconfigured.
import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { emailConfigured, sendTrialReminderEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!stripeConfigured || !supabaseConfigured || !emailConfigured) {
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  const now = Math.floor(Date.now() / 1000);
  const from = now + 12 * 3600;
  const to = now + 36 * 3600;
  let reminded = 0;
  let scanned = 0;

  try {
    const db = supabaseAdmin();
    const subs = await stripe.subscriptions.list({ status: "trialing", limit: 100 });
    for (const sub of subs.data) {
      scanned += 1;
      const end = sub.trial_end || 0;
      if (end < from || end > to) continue;
      const slug = (sub.metadata && (sub.metadata.slug as string)) || "";
      const tributeId = (sub.metadata && (sub.metadata.tributeId as string)) || "";
      let row: any = null;
      if (tributeId) {
        ({ data: row } = await db.from("tributes").select("loved_one_name, owner_email").eq("id", tributeId).maybeSingle());
      }
      if (!row && slug) {
        ({ data: row } = await db.from("tributes").select("loved_one_name, owner_email").eq("slug", slug).maybeSingle());
      }
      if (!row?.owner_email) continue;
      const chargeDate = new Date(end * 1000).toLocaleDateString("en-US", {
        month: "long", day: "numeric", timeZone: "America/Los_Angeles",
      });
      const sent = await sendTrialReminderEmail(row.owner_email, row.loved_one_name || "them", chargeDate);
      if (sent) reminded += 1;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "cron_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scanned, reminded });
}
