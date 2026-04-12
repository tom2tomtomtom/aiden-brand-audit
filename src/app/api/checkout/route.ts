import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { plan } = (await request.json()) as { plan: PlanKey };

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planConfig = PLANS[plan];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${request.headers.get("host")}`;

  const session = await stripe.checkout.sessions.create({
    mode: planConfig.mode,
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing`,
    customer_email: auth.user.email,
    metadata: {
      userId: auth.user.id,
      plan,
    },
    ...(planConfig.mode === "subscription" && {
      subscription_data: { metadata: { userId: auth.user.id, plan } },
    }),
  });

  return NextResponse.json({ url: session.url });
}
