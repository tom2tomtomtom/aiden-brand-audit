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

export type PlanKey = "starter" | "pro" | "agency";

export const PLANS: Record<PlanKey, {
  name: string;
  price: number;
  priceId: string;
  mode: "payment" | "subscription";
}> = {
  starter: {
    name: "Starter",
    price: 4900,
    priceId: process.env.STRIPE_PRICE_ID_STARTER!,
    mode: "payment" as const,
  },
  pro: {
    name: "Pro",
    price: 9900,
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    mode: "subscription" as const,
  },
  agency: {
    name: "Agency",
    price: 49900,
    priceId: process.env.STRIPE_PRICE_ID_AGENCY!,
    mode: "subscription" as const,
  },
};
