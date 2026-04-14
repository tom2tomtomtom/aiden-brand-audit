import type { Plan } from "./usage";

/**
 * Token costs per operation in a brand audit (for display/estimation only).
 * Actual token management is handled by the AIDEN Gateway.
 */
const PER_BRAND_COSTS = {
  logo_scraping: 8,
  ad_library: 10,
  color_extraction: 4,
  brand_intel: 10,
  social_sentiment: 8,
};

const PER_BRAND_TOTAL = Object.values(PER_BRAND_COSTS).reduce((a, b) => a + b, 0); // 40

const STRATEGIC_ANALYSIS_COST = 20;

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
