import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/usage";
import { getTokenBalance, ensureMonthlyGrant, getMonthlyTokenGrant, estimateAuditCost } from "@/lib/tokens";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const plan = await getUserPlan(supabase, auth.user.id);
  const balance = await ensureMonthlyGrant(supabase, auth.user.id, plan);
  const tokenData = await getTokenBalance(supabase, auth.user.id);
  const auditCost2 = estimateAuditCost(2);
  const auditCost3 = estimateAuditCost(3);

  return NextResponse.json({
    balance,
    lifetimeGranted: tokenData.lifetimeGranted,
    lifetimeSpent: tokenData.lifetimeSpent,
    plan,
    monthlyGrant: getMonthlyTokenGrant(plan),
    estimatedCosts: {
      twoBrands: auditCost2.total,
      threeBrands: auditCost3.total,
      perBrand: auditCost2.perBrand,
      analysis: auditCost2.analysis,
    },
  });
}
