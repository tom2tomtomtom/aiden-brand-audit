import { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "./usage";

/**
 * Token costs per operation in a brand audit.
 * Each audit runs these steps per brand, plus one strategic analysis.
 *
 * Raw API costs per brand:
 *   Apify logo scraping:        ~$0.05–0.10
 *   ScrapeCreators (50 ads):    ~$0.08–0.12
 *   Color extraction:           ~$0.01 (compute only)
 *   Claude brand intel:         ~$0.05–0.10
 *   Claude social sentiment:    ~$0.05–0.10
 *
 * AIDEN strategic analysis (once per audit):
 *   Claude via AIDEN API:       ~$0.10–0.30
 *
 * 1 token ≈ $0.01 at cost. We price at ~3x margin.
 */
const PER_BRAND_COSTS = {
  logo_scraping: 10,
  ad_library: 15,
  color_extraction: 5,
  brand_intel: 15,
  social_sentiment: 15,
};

const PER_BRAND_TOTAL = Object.values(PER_BRAND_COSTS).reduce((a, b) => a + b, 0); // 60

const STRATEGIC_ANALYSIS_COST = 50;

const MONTHLY_TOKEN_GRANTS: Record<Plan, number> = {
  free: 100,
  starter: 0,
  pro: 1500,
  agency: 5000,
};

export function getMonthlyTokenGrant(plan: Plan): number {
  return MONTHLY_TOKEN_GRANTS[plan];
}

export function estimateAuditCost(brandCount: number): {
  total: number;
  perBrand: number;
  analysis: number;
  breakdown: typeof PER_BRAND_COSTS;
} {
  const perBrand = PER_BRAND_TOTAL;
  const analysis = STRATEGIC_ANALYSIS_COST;
  const total = perBrand * brandCount + analysis;
  return { total, perBrand, analysis, breakdown: { ...PER_BRAND_COSTS } };
}

export interface TokenBalance {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  lastGrantMonth: string | null;
}

export async function getTokenBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<TokenBalance> {
  const { data } = await supabase
    .from("token_balances")
    .select("balance, lifetime_granted, lifetime_spent, last_grant_month")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return { balance: 0, lifetimeGranted: 0, lifetimeSpent: 0, lastGrantMonth: null };
  }

  return {
    balance: data.balance,
    lifetimeGranted: data.lifetime_granted,
    lifetimeSpent: data.lifetime_spent,
    lastGrantMonth: data.last_grant_month,
  };
}

export async function ensureMonthlyGrant(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan,
): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const balance = await getTokenBalance(supabase, userId);

  if (balance.lastGrantMonth === currentMonth) {
    return balance.balance;
  }

  const grant = getMonthlyTokenGrant(plan);
  if (grant <= 0) return balance.balance;

  const { data } = await supabase.rpc("grant_tokens", {
    p_user_id: userId,
    p_amount: grant,
    p_type: "grant",
    p_description: `Monthly ${plan} plan grant (${currentMonth})`,
  });

  return (data as number) ?? balance.balance + grant;
}

export async function grantTokenTopup(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  pack: string,
): Promise<number> {
  const { data } = await supabase.rpc("grant_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_type: "bonus",
    p_description: `Token top-up: ${pack} pack (${amount} tokens)`,
  });

  return data as number;
}

export async function grantUpgradeBonus(
  supabase: SupabaseClient,
  userId: string,
  oldPlan: Plan,
  newPlan: Plan,
): Promise<number | null> {
  const oldGrant = getMonthlyTokenGrant(oldPlan);
  const newGrant = getMonthlyTokenGrant(newPlan);
  const diff = newGrant - oldGrant;

  if (diff <= 0) return null;

  const { data } = await supabase.rpc("grant_tokens", {
    p_user_id: userId,
    p_amount: diff,
    p_type: "bonus",
    p_description: `Plan upgrade bonus: ${oldPlan} → ${newPlan}`,
  });

  return data as number;
}

export async function deductTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
  auditId?: string,
): Promise<{ success: boolean; newBalance: number }> {
  const { data } = await supabase.rpc("deduct_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
    p_audit_id: auditId ?? null,
  });

  const newBalance = data as number;

  if (newBalance === -1) {
    return { success: false, newBalance: -1 };
  }

  return { success: true, newBalance };
}

export const TOKEN_PACKS = {
  small: { tokens: 200, price: 2900, label: "200 tokens" },
  medium: { tokens: 500, price: 5900, label: "500 tokens" },
  large: { tokens: 1500, price: 14900, label: "1,500 tokens" },
} as const;

export type TokenPackKey = keyof typeof TOKEN_PACKS;
