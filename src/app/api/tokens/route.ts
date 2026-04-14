import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { estimateAuditCost } from "@/lib/tokens";

const GATEWAY_URL = process.env.GATEWAY_URL || "https://www.aiden.services";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const serviceKey = process.env.AIDEN_SERVICE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Token service not configured" }, { status: 500 });
  }

  const res = await fetch(`${GATEWAY_URL}/api/tokens/balance`, {
    headers: {
      "X-Service-Key": serviceKey,
      "X-User-Id": auth.user.id,
    },
  });

  if (!res.ok) {
    console.error(`[tokens] Gateway balance check failed: ${res.status}`);
    return NextResponse.json({ error: "Failed to fetch token balance" }, { status: 502 });
  }

  const data = await res.json();
  const auditCost2 = estimateAuditCost(2);
  const auditCost3 = estimateAuditCost(3);

  return NextResponse.json({
    balance: data.balance ?? 0,
    estimatedCosts: {
      twoBrands: auditCost2.total,
      threeBrands: auditCost3.total,
    },
  });
}
