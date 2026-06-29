import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfigured, planToTier } from "@/lib/stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe -> Supabase: payment unlocks the tier; a lapse never takes the tribute down.
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
      const tributeId = s.metadata?.tributeId || s.client_reference_id;
      const plan = s.metadata?.plan || "";
      const tier = planToTier(plan);
      if (db && tributeId) {
        await db.from("orders").insert({
          tribute_id: tributeId, kind: plan, amount_cents: s.amount_total ?? null,
          currency: s.currency || "usd", stripe_session_id: s.id,
          stripe_payment_intent: s.payment_intent || null, status: "paid",
        });
        if (tier) await db.from("tributes").update({ tier }).eq("id", tributeId);
        if (plan === "book") {
          await db.from("book_orders").insert({ tribute_id: tributeId, status: "paid", retail_cents: s.amount_total ?? null });
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      // Subscription ended: rest premium features, but keep the tribute online (Permanence Pledge).
      const sub = event.data.object;
      if (db && sub.id) {
        await db.from("subscriptions").update({ status: "canceled" }).eq("stripe_subscription_id", sub.id);
      }
    } else if (event.type === "charge.refunded") {
      const ch = event.data.object;
      if (db && ch.payment_intent) {
        await db.from("orders").update({ status: "refunded" }).eq("stripe_payment_intent", ch.payment_intent);
      }
    }
  } catch {
    // Never fail the webhook hard; Stripe will retry on 5xx.
  }
  return NextResponse.json({ received: true });
}
