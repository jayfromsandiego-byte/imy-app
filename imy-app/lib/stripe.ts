import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY || "";
export const stripeConfigured = Boolean(key);
export const stripe = key ? new Stripe(key, { apiVersion: "2024-06-20" }) : (null as unknown as Stripe);

// Price IDs come from env so we can swap test/live without code changes.
export const PRICES: Record<string, string> = {
  plus_once: process.env.STRIPE_PRICE_PLUS_ONCE || "",
  plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY || "",
  heirloom: process.env.STRIPE_PRICE_HEIRLOOM || "",
  book: process.env.STRIPE_PRICE_BOOK || "",
};

export function planToTier(plan: string): "plus" | "heirloom" | null {
  if (plan === "plus_once" || plan === "plus_monthly") return "plus";
  if (plan === "heirloom") return "heirloom";
  return null;
}
