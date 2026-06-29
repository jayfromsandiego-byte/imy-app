import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfigured, PRICES } from "@/lib/stripe";
import { getUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  if (!stripeConfigured) return NextResponse.redirect(new URL("/dashboard/billing?error=stripe", origin), { status: 303 });

  const form = await req.formData();
  const plan = String(form.get("plan") || "");
  const tributeId = String(form.get("tributeId") || "");
  const price = PRICES[plan];
  if (!price) return NextResponse.redirect(new URL("/dashboard/billing?error=plan", origin), { status: 303 });

  const user = await getUser();
  const mode: "payment" | "subscription" = plan === "plus_monthly" ? "subscription" : "payment";

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      customer_email: user?.email || undefined,
      client_reference_id: tributeId || undefined,
      metadata: { tributeId, plan, userId: user?.id || "" },
      success_url: `${origin}/dashboard/billing?upgraded=1`,
      cancel_url: `${origin}/dashboard/billing?canceled=1`,
      allow_promotion_codes: true,
    });
    return NextResponse.redirect(session.url as string, { status: 303 });
  } catch (e) {
    return NextResponse.redirect(new URL("/dashboard/billing?error=checkout", origin), { status: 303 });
  }
}
