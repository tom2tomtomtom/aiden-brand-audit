import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export const stripe = {
  get checkout() { return getStripe().checkout; },
  get subscriptions() { return getStripe().subscriptions; },
  get webhooks() { return getStripe().webhooks; },
  get customers() { return getStripe().customers; },
} as unknown as Stripe;

export type PlanKey = "pro" | "agency";

export const PLANS: Record<PlanKey, {
  name: string;
  price: number;
  priceId: string;
  mode: "subscription";
  monthlyTokens: number;
}> = {
  pro: {
    name: "Pro",
    price: 4900,
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    mode: "subscription",
    monthlyTokens: 1500,
  },
  agency: {
    name: "Agency",
    price: 19900,
    priceId: process.env.STRIPE_PRICE_ID_AGENCY!,
    mode: "subscription",
    monthlyTokens: 5000,
  },
};
