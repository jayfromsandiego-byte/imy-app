// Stripe → Supabase. Payment unlocks the tier the second it lands; a lapse rests
// features but NEVER takes a tribute down (Permanence Pledge).
//
// Launch-night extensions (July 5):
//  · family_unlock → tier=plus + the sponsor badge (name/photo/message) in one write,
//    and every waiting memory wakes for everyone (render-side).
//  · subscription checkouts upsert a subscriptions row (trialing → active), so the
//    dashboard can show honest trial state.
//  · referral use counted when a ref code rode the session.
//  · customer.subscription.updated/deleted keep the row truthful. Tier stays generous.
import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfigured, planToTier } from "@/lib/stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { ensureFullFilmForPaid } from "@/lib/film";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dataOrThrow(result: any) {
  if (result?.error) throw result.error;
  return result?.data;
}

export async function POST(req: NextRequest) {
  if (!stripeConfigured) return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) return NextResponse.json({ ok: false, error: "webhook_secret_missing" }, { status: 503 });
  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  }

  const db = supabaseConfigured ? supabaseAdmin() : null;
  if (!db) return NextResponse.json({ ok: false, error: "database_not_configured" }, { status: 503 });
  let orderSessionId = "";

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      orderSessionId = String(s.id || "");
      const md = s.metadata || {};
      const plan = md.plan || "";
      const tier = plan === "family_unlock" ? "plus" : planToTier(plan);

      // Resolve the tribute by id when we have it, else by slug (guest wall flow).
      let tributeId: string | null = md.tributeId || s.client_reference_id || null;
      if (!tributeId && md.slug) {
        const data = dataOrThrow(await db.from("tributes").select("id").eq("slug", md.slug).maybeSingle());
        tributeId = data?.id || null;
      }

      // Money moved but no page could be found: never let that be silent.
      // A tribute-less order row keeps the payment on the books for a human
      // to reconcile — the alternative was Stripe saying paid and the app
      // remembering nothing (found in the July 12 audit).
      if (!tributeId) {
        dataOrThrow(await db.from("orders").upsert({
          tribute_id: null, kind: plan || "unknown", amount_cents: s.amount_total ?? null,
          currency: s.currency || "usd", stripe_session_id: s.id,
          stripe_payment_intent: s.payment_intent || null, status: "paid_unmatched",
          fulfillment_status: "needs_attention", fulfillment_error: "tribute-not-matched",
        }, { onConflict: "stripe_session_id" }));
      }

      if (tributeId) {
        // Upsert, not insert: Stripe delivers at least once, and a replayed
        // event must never book the same gift twice (unique since 0018).
        dataOrThrow(await db.from("orders").upsert({
          tribute_id: tributeId, kind: plan, amount_cents: s.amount_total ?? null,
          currency: s.currency || "usd", stripe_session_id: s.id,
          stripe_payment_intent: s.payment_intent || null, status: "paid",
          fulfillment_status: "processing", fulfillment_error: null, fulfilled_at: null,
        }, { onConflict: "stripe_session_id" }));
        let fulfillmentStatus: "processing" | "waiting_on_family" | "ready" | "not_applicable" = "not_applicable";

        if (tier) {
          const patch: Record<string, unknown> = { tier };
          if (plan === "family_unlock" && md.sponsorName) {
            patch.sponsor_name = String(md.sponsorName).slice(0, 80);
            patch.sponsor_message = String(md.sponsorMessage || "").slice(0, 200) || null;
            patch.sponsor_photo_url = /^https:\/\//.test(md.sponsorPhotoUrl || "")
              ? String(md.sponsorPhotoUrl).slice(0, 600)
              : null;
          }
          dataOrThrow(await db.from("tributes").update(patch).eq("id", tributeId));

          // Their film (0022): the $97 includes the whole film. Queueing is
          // atomic and any failure returns 500 so Stripe retries the promise.
          if (tier === "plus" || tier === "heirloom") {
            await ensureFullFilmForPaid(tributeId);
            const jobs = dataOrThrow(await db
              .from("film_jobs")
              .select("status")
              .eq("tribute_id", tributeId)
              .or("variant.eq.full,rendered_variant.eq.full")
              .is("deleted_at", null)
              .order("created_at", { ascending: false })
              .limit(1));
            const filmState = jobs?.[0]?.status || "queued";
            fulfillmentStatus = filmState === "approved"
              ? "ready"
              : filmState === "waiting_for_photos"
                ? "waiting_on_family"
                : "processing";
          }
        }

        if (plan === "book") {
          dataOrThrow(await db.from("book_orders").insert({ tribute_id: tributeId, status: "paid", retail_cents: s.amount_total ?? null }));
        }

        // Subscription checkouts (the trial path): keep an honest row.
        if (s.mode === "subscription" && s.subscription) {
          dataOrThrow(await db.from("subscriptions").upsert(
            {
              tribute_id: tributeId,
              stripe_subscription_id: String(s.subscription),
              status: "trialing", // Stripe flips it to active on day 3; .updated keeps us truthful
              kind: "plus_monthly",
            },
            { onConflict: "stripe_subscription_id" }
          ));
        }

        // Count the referral use (non-fatal).
        if (md.ref) {
          try {
            const { data: r } = await db.from("referrals").select("uses").eq("code", md.ref).maybeSingle();
            if (r) await db.from("referrals").update({ uses: (r.uses || 0) + 1 }).eq("code", md.ref);
          } catch { /* ignore */ }
        }

        dataOrThrow(await db.from("orders").update({
          fulfillment_status: fulfillmentStatus,
          fulfillment_error: null,
          fulfilled_at: fulfillmentStatus === "ready" || fulfillmentStatus === "not_applicable"
            ? new Date().toISOString()
            : null,
        }).eq("stripe_session_id", s.id));
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      if (sub.id) {
        dataOrThrow(await db.from("subscriptions")
          .update({ status: sub.status || "active" })
          .eq("stripe_subscription_id", sub.id));
      }
    } else if (event.type === "invoice.payment_failed") {
      // A missed renewal begins the grace period: the row turns past_due.
      // The monthly ownership model is still an open product decision, so this
      // event records truth without silently changing the memorial's tier.
      const inv = event.data.object;
      if (inv.subscription) {
        dataOrThrow(await db.from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", String(inv.subscription)));
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Record the cancellation. Do not guess whether monthly is a plain
      // subscription or a payment plan completing into ownership; that product
      // decision remains open, and the tribute itself always stays online.
      const sub = event.data.object;
      if (sub.id) {
        dataOrThrow(await db.from("subscriptions").update({ status: "canceled" }).eq("stripe_subscription_id", sub.id));
      }
    } else if (event.type === "charge.refunded") {
      const ch = event.data.object;
      if (ch.payment_intent) {
        const fullyRefunded = ch.refunded === true ||
          (Number(ch.amount || 0) > 0 && Number(ch.amount_refunded || 0) >= Number(ch.amount || 0));
        if (fullyRefunded) {
          // 0023: the ledger keeps the refund, and the memorial returns to Free
          // only when no other paid order or living subscription still opens it.
          // The tribute and its woven film remain kept; paid surfaces simply rest.
          dataOrThrow(await db.rpc("rest_plus_after_full_refund", {
            p_payment_intent: String(ch.payment_intent),
          }));
        } else {
          dataOrThrow(await db.from("orders")
            .update({ status: "partially_refunded" })
            .eq("stripe_payment_intent", ch.payment_intent));
        }
      }
    } else if (event.type === "charge.dispute.created") {
      // A dispute never touches the page (the pledge holds) — but the books
      // must know it exists, so support sees it without opening Stripe.
      const dp = event.data.object;
      if (dp.payment_intent) {
        dataOrThrow(await db.from("orders").update({ status: "disputed" }).eq("stripe_payment_intent", dp.payment_intent));
      }
    }
  } catch (error: any) {
    const message = String(error?.message || "webhook-fulfillment-failed").slice(0, 240);
    if (orderSessionId) {
      try {
        await db.from("orders").update({
          fulfillment_status: "needs_attention",
          fulfillment_error: message,
        }).eq("stripe_session_id", orderSessionId);
      } catch { /* Stripe retry remains the source of recovery */ }
    }
    // 5xx is deliberate: Stripe retries until the paid promise is recorded.
    return NextResponse.json({ received: false, error: "fulfillment_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
