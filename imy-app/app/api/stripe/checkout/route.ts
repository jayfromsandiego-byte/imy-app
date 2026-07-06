// POST /api/stripe/checkout — every paid path in one place.
//
// Plans:
//   plus_once      · $97 one-time, charges today, yours forever
//   plus_monthly   · $12/month with a 3-DAY FREE TRIAL — card collected up front,
//                    auto-converts on day 3 unless cancelled (founder decision July 5:
//                    the trial applies to the monthly path only)
//   family_unlock  · $97 one-time, GUEST checkout from the memory wall — no account;
//                    carries the sponsor's name/message so the webhook can write the badge
//   heirloom/book  · legacy plans kept for compatibility
//
// Referrals: a `ref` field (set from the ?ref= cookie the landing page drops) is
// resolved to a live Stripe promotion code and auto-applied — 20% off, monthly only.
// Accepts form posts (dashboard/billing) and JSON (the letter's seal + the wall).
import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfigured, PRICES } from "@/lib/stripe";
import { getUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      const j = await req.json();
      return Object.fromEntries(Object.entries(j || {}).map(([k, v]) => [k, String(v ?? "")]));
    } catch { return {}; }
  }
  try {
    const form = await req.formData();
    const out: Record<string, string> = {};
    form.forEach((v, k) => { out[k] = String(v); });
    return out;
  } catch { return {}; }
}

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const wantsJson = (req.headers.get("content-type") || "").includes("application/json");
  const p = await readParams(req);

  const fail = (code: string) =>
    wantsJson
      ? NextResponse.json({ ok: false, error: code }, { status: 400 })
      : NextResponse.redirect(new URL(`/dashboard/billing?error=${code}`, origin), { status: 303 });

  if (!stripeConfigured) return fail("stripe");

  const plan = clean(p.plan, 30);
  const tributeId = clean(p.tributeId, 60);
  const slug = clean(p.slug, 80);
  const priceKey = plan === "family_unlock" ? "plus_once" : plan;
  const price = PRICES[priceKey];
  if (!price) return fail("plan");

  const user = await getUser();
  const mode: "payment" | "subscription" = plan === "plus_monthly" ? "subscription" : "payment";

  // Where the buyer lands afterwards. The letter and the wall send the tribute's
  // own page; the dashboard keeps its billing return.
  const fallbackReturn = slug ? `/sites/${slug}` : "/dashboard/billing";
  const returnTo = (p.returnTo || "").startsWith("/") ? p.returnTo : fallbackReturn;
  const success_url = `${origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}upgraded=1`;
  const cancel_url = `${origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}canceled=1`;

  // Referral → 20% off, monthly only, auto-applied.
  let discounts: Array<{ promotion_code: string }> | undefined;
  const ref = clean(p.ref, 40).toUpperCase();
  if (ref && mode === "subscription") {
    try {
      const codes = await stripe.promotionCodes.list({ code: ref, active: true, limit: 1 });
      if (codes.data[0]) discounts = [{ promotion_code: codes.data[0].id }];
    } catch { /* a bad code never blocks a purchase */ }
  }

  // Sponsor details ride in metadata; the webhook writes the badge.
  const sponsorName = clean(p.sponsorName, 80);
  const sponsorMessage = clean(p.sponsorMessage, 200);
  const sponsorPhotoUrl = /^https:\/\//.test(p.sponsorPhotoUrl || "") ? clean(p.sponsorPhotoUrl, 600) : "";

  try {
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      customer_email: user?.email || clean(p.email, 200) || undefined,
      client_reference_id: tributeId || undefined,
      metadata: {
        tributeId, slug, plan,
        userId: user?.id || "",
        kind: plan === "family_unlock" ? "family_unlock" : "self",
        sponsorName, sponsorMessage, sponsorPhotoUrl,
        ref: ref || "",
      },
      ...(mode === "subscription"
        ? {
            payment_method_collection: "always" as const, // card up front, even in trial
            subscription_data: {
              trial_period_days: 3,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } },
              metadata: { tributeId, slug, plan },
            },
          }
        : {}),
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      success_url,
      cancel_url,
    });

    return wantsJson
      ? NextResponse.json({ ok: true, url: session.url })
      : NextResponse.redirect(session.url as string, { status: 303 });
  } catch {
    return fail("checkout");
  }
}
