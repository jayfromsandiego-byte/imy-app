// GET /api/cron/film-health — independent watch over the paid film promise.
// The worker cannot report its own death, so Vercel checks the queue and the
// heartbeat from outside the renderer. Alerts contain ids and counts, never a
// family's words, photographs, email address, or film-room token.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { emailConfigured, sendOpsAlertEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dataOrThrow(result: any) {
  if (result?.error) throw result.error;
  return result?.data || [];
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  }

  try {
    const db = supabaseAdmin();
    const now = Date.now();
    const heartbeatCutoff = new Date(now - 5 * 60_000).toISOString();
    const queueCutoff = new Date(now - 15 * 60_000).toISOString();
    const renderCutoff = new Date(now - 50 * 60_000).toISOString();
    const recentCutoff = new Date(now - 24 * 60 * 60_000).toISOString();

    const [heartbeats, queued, rendering, failed, orders, notifications, priorRows] = await Promise.all([
      db.from("film_worker_heartbeats").select("worker_id,state,last_seen_at").order("last_seen_at", { ascending: false }).limit(1),
      db.from("film_jobs").select("id,created_at").eq("status", "queued").lt("created_at", queueCutoff).is("deleted_at", null).limit(20),
      db.from("film_jobs").select("id,started_at").eq("status", "rendering").lt("started_at", renderCutoff).is("deleted_at", null).limit(20),
      db.from("film_jobs").select("id,error,finished_at").eq("status", "failed").gte("finished_at", recentCutoff).is("deleted_at", null).limit(20),
      db.from("orders").select("id,fulfillment_error,created_at").eq("fulfillment_status", "needs_attention").gte("created_at", recentCutoff).limit(20),
      db.from("film_jobs").select("id,notification_status,finished_at").eq("notification_status", "failed").gte("finished_at", recentCutoff).is("deleted_at", null).limit(20),
      db.from("ops_monitor_state").select("fingerprint,last_alerted_at").eq("monitor_key", "film-health").maybeSingle(),
    ]);

    const hb = dataOrThrow(heartbeats)[0];
    const oldQueued = dataOrThrow(queued);
    const stuckRendering = dataOrThrow(rendering);
    const failedJobs = dataOrThrow(failed);
    const attentionOrders = dataOrThrow(orders);
    const failedNotices = dataOrThrow(notifications);
    const prior = dataOrThrow(priorRows);
    const issues: string[] = [];

    if (!hb || !hb.last_seen_at || hb.last_seen_at < heartbeatCutoff) {
      issues.push("No current film-worker heartbeat in the last five minutes.");
    }
    if (oldQueued.length) issues.push(`${oldQueued.length} film job(s) have waited in the queue for more than 15 minutes.`);
    if (stuckRendering.length) issues.push(`${stuckRendering.length} film job(s) have rendered for more than 50 minutes.`);
    if (failedJobs.length) issues.push(`${failedJobs.length} film job(s) failed in the last 24 hours.`);
    if (attentionOrders.length) issues.push(`${attentionOrders.length} paid order(s) need fulfillment attention.`);
    if (failedNotices.length) issues.push(`${failedNotices.length} film-ready email(s) did not send.`);

    if (!issues.length) {
      dataOrThrow(await db.from("ops_monitor_state").upsert({
        monitor_key: "film-health",
        fingerprint: "ok",
        last_ok_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
      }, { onConflict: "monitor_key" }));
      return NextResponse.json({ ok: true, healthy: true });
    }

    const ids = [oldQueued, stuckRendering, failedJobs, attentionOrders, failedNotices]
      .flat()
      .map((row: any) => String(row.id || "").slice(0, 8))
      .filter(Boolean)
      .sort();
    const fingerprint = JSON.stringify({ issues, ids });
    const lastAlerted = prior?.last_alerted_at ? new Date(prior.last_alerted_at).getTime() : 0;
    const shouldAlert = fingerprint !== prior?.fingerprint || now - lastAlerted > 6 * 60 * 60_000;
    let alerted = false;

    if (shouldAlert && emailConfigured) {
      alerted = await sendOpsAlertEmail("Film fulfillment needs attention", [
        ...issues,
        ...(ids.length ? [`References: ${ids.join(", ")}`] : []),
      ]);
      if (alerted) {
        dataOrThrow(await db.from("ops_monitor_state").upsert({
          monitor_key: "film-health",
          fingerprint,
          last_alerted_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        }, { onConflict: "monitor_key" }));
      }
    }

    return NextResponse.json({ ok: true, healthy: false, issueCount: issues.length, alerted });
  } catch {
    return NextResponse.json({ ok: false, error: "film_health_check_failed" }, { status: 500 });
  }
}
