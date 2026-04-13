import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";
import { TOKEN_PACKS, type TokenPackKey } from "@/lib/tokens";

export async function GET() {
  return NextResponse.json({ packs: TOKEN_PACKS });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { pack } = (await request.json()) as { pack: string };

  if (!pack || !(pack in TOKEN_PACKS)) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const packConfig = TOKEN_PACKS[pack as TokenPackKey];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${request.headers.get("host")}`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: packConfig.price,
          product_data: {
            name: `Brand DNA Analyzer — ${packConfig.label}`,
            description: `Top up ${packConfig.tokens} audit tokens`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?topup=success`,
    cancel_url: `${baseUrl}/dashboard`,
    customer_email: auth.user.email,
    metadata: {
      userId: auth.user.id,
      type: "token_topup",
      pack,
      tokens: String(packConfig.tokens),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
