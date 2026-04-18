import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";

const PlanKeys = Object.keys(PLANS) as [PlanKey, ...PlanKey[]];
const CheckoutSchema = z.object({
  plan: z.enum(PlanKeys),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return auth.response;

    const parsed = CheckoutSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const { plan } = parsed.data;

    const planConfig = PLANS[plan];
    if (!planConfig.priceId) {
      console.error(`[checkout] Missing price ID for plan: ${plan}`);
      return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
    }

    // Only trust NEXT_PUBLIC_SITE_URL for Stripe redirect URLs. Using
    // request.headers.host as a fallback turned this into an
    // open-redirect primitive: an attacker could set Host: evil.com,
    // hit /api/checkout, and Stripe would happily redirect the payer to
    // evil.com/dashboard?checkout=success after payment.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) {
      console.error("[checkout] NEXT_PUBLIC_SITE_URL not configured");
      return NextResponse.json(
        { error: "Checkout not configured" },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing`,
      customer_email: auth.user.email,
      metadata: {
        userId: auth.user.id,
        plan,
      },
      subscription_data: {
        metadata: { userId: auth.user.id, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Stripe errors can include API keys, customer IDs, or request IDs
    // that shouldn't leak to the browser — log server-side only.
    console.error("[checkout] Error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
