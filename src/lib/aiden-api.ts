import Anthropic from "@anthropic-ai/sdk";
import { extractAndRepairJson } from "./json-repair";

const AIDEN_API_BASE = process.env.AIDEN_API_URL || "https://aiden-api-production.up.railway.app";
const AIDEN_API_KEY = process.env.AIDEN_API_KEY || "";

export interface BrandAnalysisInput {
  name: string;
  confirmedPageName: string | null;
  adCount: number;
  primaryColors: string[];
  adCreativeColors: string[];
  platformMix: { platform: string; percent: number }[];
  ctaDistribution: { cta: string; percent: number }[];
  formatMix: { videoPercent: number; carouselPercent: number; imagePercent: number };
  avgCopyLength: number;
  dateRange: { earliest: string | null; latest: string | null };
  topAdCopy: string[];
  topHeadlines: string[];
  pressSummary: string[];
  recentActivations: string[];
  recentCampaigns: string[];
  socialPlatforms: string[];
  socialSentiment: {
    totalPosts: number;
    totalEngagement: number;
    overallScore: number | null;
    overallLabel: string;
    brandPerception: string;
    reputationRisks: string[];
    advocacyDrivers: string[];
    positiveThemes: string[];
    negativeThemes: string[];
    platformBreakdown: { platform: string; posts: number; engagement: number }[];
    topTikTokContent: string[];
    topRedditDiscussions: string[];
    topInstagramPosts: string[];
  } | null;
}

function buildBrandSummary(brandsData: BrandAnalysisInput[]): string {
  return brandsData
    .map((b) => {
      const parts = [
        `Brand: ${b.name}${b.confirmedPageName ? ` (Facebook Page: ${b.confirmedPageName})` : ""}`,
        `- ${b.adCount} active Facebook ads collected`,
        `- Brand colors: ${b.primaryColors.length > 0 ? b.primaryColors.join(", ") : "not extracted"}`,
        `- Ad creative colors: ${b.adCreativeColors.length > 0 ? b.adCreativeColors.join(", ") : "not extracted"}`,
        `- Platform mix: ${b.platformMix.map(p => `${p.platform} ${p.percent}%`).join(", ") || "unknown"}`,
        `- CTA distribution: ${b.ctaDistribution.map(c => `${c.cta} ${c.percent}%`).join(", ") || "none detected"}`,
        `- Format mix: ${b.formatMix.imagePercent}% image, ${b.formatMix.videoPercent}% video, ${b.formatMix.carouselPercent}% carousel`,
        `- Average copy length: ${b.avgCopyLength} characters`,
        `- Active date range: ${b.dateRange.earliest || "unknown"} to ${b.dateRange.latest || "unknown"}`,
      ];
      if (b.topHeadlines.length > 0) {
        parts.push(`- Top headlines: ${b.topHeadlines.join(" | ")}`);
      }
      if (b.topAdCopy.length > 0) {
        parts.push(`- Sample ad copy:\n${b.topAdCopy.map((c, i) => `  ${i + 1}. "${c}"`).join("\n")}`);
      }
      if (b.pressSummary.length > 0) {
        parts.push(`- Recent press coverage: ${b.pressSummary.join(" | ")}`);
      }
      if (b.recentActivations.length > 0) {
        parts.push(`- Brand activations: ${b.recentActivations.join(", ")}`);
      }
      if (b.recentCampaigns.length > 0) {
        parts.push(`- Recent campaigns:\n${b.recentCampaigns.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}`);
      }
      if (b.socialPlatforms.length > 0) {
        parts.push(`- Social presence: ${b.socialPlatforms.join(", ")}`);
      }
      if (b.socialSentiment) {
        const ss = b.socialSentiment;
        parts.push(`\n--- PUBLIC SENTIMENT (from organic social media) ---`);
        parts.push(`- Sentiment score: ${ss.overallScore ?? "N/A"}/100 (${ss.overallLabel})`);
        parts.push(`- ${ss.totalPosts} organic posts scraped across ${ss.platformBreakdown.map(p => `${p.platform} (${p.posts})`).join(", ")}`);
        if (ss.brandPerception) {
          parts.push(`- Public perception: ${ss.brandPerception}`);
        }
        if (ss.positiveThemes.length > 0) {
          parts.push(`- What people LOVE: ${ss.positiveThemes.join(" | ")}`);
        }
        if (ss.negativeThemes.length > 0) {
          parts.push(`- What people HATE: ${ss.negativeThemes.join(" | ")}`);
        }
        if (ss.reputationRisks.length > 0) {
          parts.push(`- Reputation risks: ${ss.reputationRisks.join("; ")}`);
        }
        if (ss.advocacyDrivers.length > 0) {
          parts.push(`- Advocacy drivers: ${ss.advocacyDrivers.join("; ")}`);
        }
        if (ss.topRedditDiscussions.length > 0) {
          parts.push(`- Reddit discussions:\n${ss.topRedditDiscussions.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}`);
        }
      }
      return parts.join("\n");
    })
    .join("\n\n");
}

const ANALYSIS_PROMPT = `TASK: Produce a competitive brand DNA analysis as a JSON object.

INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON object. No text before or after.
- No markdown fences. No explanation. Just the JSON.
- Use the exact brand names from the data as keys.
- Ground your analysis in the actual data provided (platform mix, CTA patterns, copy samples, color palettes, format choices, AND public sentiment data).
- Be specific and cite evidence from the data. Don't be generic.
- IMPORTANT: Where public sentiment data is available, integrate it into your analysis. Note gaps between how the brand presents itself (ads) vs how the public actually perceives it. Flag reputation risks and advocacy opportunities.

REQUIRED JSON STRUCTURE:
{"executiveSummary":{"overview":"2-3 sentence competitive overview grounded in the data","keyFindings":["finding1","finding2","finding3","finding4","finding5"],"strategicImplications":"paragraph on strategic implications"},"visualDna":{"colorStrategies":{"BrandName":"color strategy description based on actual palette data"},"visualDifferentiation":"paragraph on visual differences citing specific colors and format choices","sharedPatterns":["shared pattern 1","shared pattern 2"],"uniqueElements":{"BrandName":["unique element 1","unique element 2"]}},"creativeDna":{"messagingThemes":{"BrandName":["theme 1 from actual copy","theme 2"]},"toneAndVoice":{"BrandName":"tone description based on actual ad copy samples"},"creativeDirections":{"BrandName":["direction 1","direction 2"]}},"strategicSynthesis":{"competitivePositioning":{"BrandName":{"strengths":["s1","s2"],"weaknesses":["w1","w2"],"marketPosition":"position description"}},"whiteSpaceOpportunities":["opportunity 1 based on gaps in data","opportunity 2"],"recommendedActions":[{"action":"specific action","rationale":"why, citing data","expectedImpact":"impact"}]}}`;

async function analyzeWithClaude(brandsData: BrandAnalysisInput[]): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const brandSummary = buildBrandSummary(brandsData);

  console.log("[aiden] Using Claude fallback for strategic analysis");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `${ANALYSIS_PROMPT}\n\nDATA:\n${brandSummary}`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonStr = extractAndRepairJson(raw);
  JSON.parse(jsonStr);
  return jsonStr;
}

interface AidenChatResponse {
  success: boolean;
  data: { content: string; metadata?: unknown };
}

async function analyzeWithAidenAPI(brandsData: BrandAnalysisInput[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const brandSummary = buildBrandSummary(brandsData);
    const message = `${ANALYSIS_PROMPT}\n\nDATA:\n${brandSummary}`;

    const response = await fetch(`${AIDEN_API_BASE}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": AIDEN_API_KEY,
      },
      body: JSON.stringify({ message, context: { brandsData } }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AIDEN API failed (${response.status}): ${text}`);
    }

    const result: AidenChatResponse = await response.json();
    const raw = result.data.content;
    const jsonStr = extractAndRepairJson(raw);
    JSON.parse(jsonStr);
    return jsonStr;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeWithAiden(brandsData: BrandAnalysisInput[]): Promise<string> {
  if (AIDEN_API_KEY) {
    try {
      console.log("[aiden] Trying AIDEN API...");
      return await analyzeWithAidenAPI(brandsData);
    } catch (e) {
      console.warn("[aiden] AIDEN failed, falling back to Claude:", e instanceof Error ? e.message : e);
    }
  } else {
    console.log("[aiden] No AIDEN API key — using Claude directly");
  }

  console.log("[aiden] Starting Claude fallback analysis...");
  return await analyzeWithClaude(brandsData);
}

export async function getAidenHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AIDEN_API_BASE}/api/v1/health`, {
      headers: { "X-API-Key": AIDEN_API_KEY },
    });
    return response.ok;
  } catch {
    return false;
  }
}
