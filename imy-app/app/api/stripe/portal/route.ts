import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  if (!stripeConfigured) return NextResponse.redirect(new URL("/dashboard/billing?error=stripe", origin), { status: 303 });
  const user = await getUser();
  if (!user?.email) return NextResponse.redirect(new URL("/signin", origin), { status: 303 });
  try {
    const found = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = found.data[0];
    if (!customer) return NextResponse.redirect(new URL("/dashboard/billing?error=nocustomer", origin), { status: 303 });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/dashboard/billing`,
    });
    return NextResponse.redirect(portal.url, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/dashboard/billing?error=portal", origin), { status: 303 });
  }
}
