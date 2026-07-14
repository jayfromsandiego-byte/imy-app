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

export async function POST(req: NextRequest) {
  if (!stripeConfigured) return NextResponse.json({ ok: false }, { status: 200 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: any;
  try {
    event = secret ? stripe.webhooks.constructEvent(raw, sig, secret) : JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  }

  const db = supabaseConfigured ? supabaseAdmin() : null;

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const md = s.metadata || {};
      const plan = md.plan || "";
      const tier = plan === "family_unlock" ? "plus" : planToTier(plan);

      // Resolve the tribute by id when we have it, else by slug (guest wall flow).
      let tributeId: string | null = md.tributeId || s.client_reference_id || null;
      if (db && !tributeId && md.slug) {
        const { data } = await db.from("tributes").select("id").eq("slug", md.slug).maybeSingle();
        tributeId = data?.id || null;
      }

      // Money moved but no page could be found: never let that be silent.
      // A tribute-less order row keeps the payment on the books for a human
      // to reconcile — the alternative was Stripe saying paid and the app
      // remembering nothing (found in the July 12 audit).
      if (db && !tributeId) {
        await db.from("orders").upsert({
          tribute_id: null, kind: plan || "unknown", amount_cents: s.amount_total ?? null,
          currency: s.currency || "usd", stripe_session_id: s.id,
          stripe_payment_intent: s.payment_intent || null, status: "paid_unmatched",
        }, { onConflict: "stripe_session_id" });
      }

      if (db && tributeId) {
        // Upsert, not insert: Stripe delivers at least once, and a replayed
        // event must never book the same gift twice (unique since 0018).
        await db.from("orders").upsert({
          tribute_id: tributeId, kind: plan, amount_cents: s.amount_total ?? null,
          currency: s.currency || "usd", stripe_session_id: s.id,
          stripe_payment_intent: s.payment_intent || null, status: "paid",
        }, { onConflict: "stripe_session_id" });

        if (tier) {
          const patch: Record<string, unknown> = { tier };
          if (plan === "family_unlock" && md.sponsorName) {
            patch.sponsor_name = String(md.sponsorName).slice(0, 80);
            patch.sponsor_message = String(md.sponsorMessage || "").slice(0, 200) || null;
            patch.sponsor_photo_url = /^https:\/\//.test(md.sponsorPhotoUrl || "")
              ? String(md.sponsorPhotoUrl).slice(0, 600)
              : null;
          }
          await db.from("tributes").update(patch).eq("id", tributeId);

          // Their film (0021): the $97 includes the whole film. The moment the
          // tier turns, make sure a full weave is on its way — the worker will
          // place it on the page itself when it finishes. Non-fatal, like the rest.
          if (tier === "plus" || tier === "heirloom") {
            try {
              await ensureFullFilmForPaid(tributeId);
            } catch { /* the keeper can ask for the weave from the film room */ }
          }
        }

        if (plan === "book") {
          await db.from("book_orders").insert({ tribute_id: tributeId, status: "paid", retail_cents: s.amount_total ?? null });
        }

        // Subscription checkouts (the trial path): keep an honest row.
        if (s.mode === "subscription" && s.subscription) {
          await db.from("subscriptions").upsert(
            {
              tribute_id: tributeId,
              stripe_subscription_id: String(s.subscription),
              status: "trialing", // Stripe flips it to active on day 3; .updated keeps us truthful
              plan: "plus_monthly",
            },
            { onConflict: "stripe_subscription_id" }
          );
        }

        // Count the referral use (non-fatal).
        if (md.ref) {
          try {
            const { data: r } = await db.from("referrals").select("uses").eq("code", md.ref).maybeSingle();
            if (r) await db.from("referrals").update({ uses: (r.uses || 0) + 1 }).eq("code", md.ref);
          } catch { /* ignore */ }
        }
      }
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      if (db && sub.id) {
        await db.from("subscriptions")
          .update({ status: sub.status || "active" })
          .eq("stripe_subscription_id", sub.id);
      }
    } else if (event.type === "invoice.payment_failed") {
      // A missed renewal begins the grace period: the row turns past_due,
      // premium features rest later, the tribute itself never comes down.
      const inv = event.data.object;
      if (db && inv.subscription) {
        await db.from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", String(inv.subscription));
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Subscription ended: rest premium features, keep the tribute online (Permanence Pledge).
      const sub = event.data.object;
      if (db && sub.id) {
        await db.from("subscriptions").update({ status: "canceled" }).eq("stripe_subscription_id", sub.id);
      }
    } else if (event.type === "charge.refunded") {
      const ch = event.data.object;
      if (db && ch.payment_intent) {
        await db.from("orders").update({ status: "refunded" }).eq("stripe_payment_intent", ch.payment_intent);
      }
    } else if (event.type === "charge.dispute.created") {
      // A dispute never touches the page (the pledge holds) — but the books
      // must know it exists, so support sees it without opening Stripe.
      const dp = event.data.object;
      if (db && dp.payment_intent) {
        await db.from("orders").update({ status: "disputed" }).eq("stripe_payment_intent", dp.payment_intent);
      }
    }
  } catch {
    // Never fail the webhook hard; Stripe retries on 5xx.
  }
  return NextResponse.json({ received: true });
}
