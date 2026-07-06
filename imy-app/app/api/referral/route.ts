// GET /api/referral — the signed-in owner's personal invite code (minted on first ask).
// Share link: https://imissyoumemorial.com/?ref=CODE → 20% off Plus monthly, forever,
// auto-applied at checkout. One Stripe coupon backs every code; each person gets
// their own promotion code on top of it.
import { NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabaseServer";
import { getUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COUPON_ID = "imy-referral-20"; // 20% forever, created once, reused for every code

function mintCode(email: string) {
  const stem = (email.split("@")[0] || "friend").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "FRIEND";
  return `${stem}${Math.floor(100 + Math.random() * 900)}`;
}

async function ensureCoupon() {
  try {
    await stripe.coupons.retrieve(COUPON_ID);
  } catch {
    await stripe.coupons.create({
      id: COUPON_ID,
      percent_off: 20,
      duration: "forever",
      name: "Invited by a friend · 20% off Plus monthly",
    });
  }
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "signin" }, { status: 401 });
  if (!supabaseConfigured) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const db = supabaseAdmin();

  // Existing code?
  const { data: existing } = await db.from("referrals").select("code,uses").eq("owner_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ ok: true, code: existing.code, uses: existing.uses || 0 });

  if (!stripeConfigured) return NextResponse.json({ ok: false, error: "stripe" }, { status: 503 });

  // Mint: coupon (once) → promotion code → row.
  await ensureCoupon();
  let code = mintCode(user.email || "");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const promo = await stripe.promotionCodes.create({
        coupon: COUPON_ID,
        code,
        restrictions: {}, // monthly-only is enforced at checkout (we only apply ref on subscriptions)
      });
      const { error } = await db.from("referrals").insert({
        code, owner_id: user.id, owner_email: user.email || null, stripe_promotion_code_id: promo.id,
      });
      if (!error) return NextResponse.json({ ok: true, code, uses: 0 });
      code = mintCode(user.email || "");
    } catch {
      code = mintCode(user.email || "");
    }
  }
  return NextResponse.json({ ok: false, error: "mint_failed" }, { status: 500 });
}
