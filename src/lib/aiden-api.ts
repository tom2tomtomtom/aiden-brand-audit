const AIDEN_API_BASE = process.env.AIDEN_API_URL || "https://aiden-api-production.up.railway.app";
const AIDEN_API_KEY = process.env.AIDEN_API_KEY || "";

async function callAidenAPI<T>(path: string, body: unknown, timeoutMs = 120000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${AIDEN_API_BASE}/api/v1${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": AIDEN_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AIDEN API ${path} failed (${response.status}): ${text}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export interface AidenChatResponse {
  success: boolean;
  data: {
    content: string;
    metadata?: unknown;
  };
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();

  return text.trim();
}

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
}

export async function analyzeWithAiden(brandsData: BrandAnalysisInput[]): Promise<string> {
  const brandSummary = brandsData
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
      return parts.join("\n");
    })
    .join("\n\n");

  const message = `TASK: Produce a competitive brand DNA analysis as a JSON object.

DATA:
${brandSummary}

INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON object. No text before or after.
- No markdown fences. No explanation. Just the JSON.
- Use the exact brand names from the data as keys.
- Ground your analysis in the actual data provided (platform mix, CTA patterns, copy samples, color palettes, format choices).
- Be specific and cite evidence from the data. Don't be generic.

REQUIRED JSON STRUCTURE:
{"executiveSummary":{"overview":"2-3 sentence competitive overview grounded in the data","keyFindings":["finding1","finding2","finding3","finding4","finding5"],"strategicImplications":"paragraph on strategic implications"},"visualDna":{"colorStrategies":{"BrandName":"color strategy description based on actual palette data"},"visualDifferentiation":"paragraph on visual differences citing specific colors and format choices","sharedPatterns":["shared pattern 1","shared pattern 2"],"uniqueElements":{"BrandName":["unique element 1","unique element 2"]}},"creativeDna":{"messagingThemes":{"BrandName":["theme 1 from actual copy","theme 2"]},"toneAndVoice":{"BrandName":"tone description based on actual ad copy samples"},"creativeDirections":{"BrandName":["direction 1","direction 2"]}},"strategicSynthesis":{"competitivePositioning":{"BrandName":{"strengths":["s1","s2"],"weaknesses":["w1","w2"],"marketPosition":"position description"}},"whiteSpaceOpportunities":["opportunity 1 based on gaps in data","opportunity 2"],"recommendedActions":[{"action":"specific action","rationale":"why, citing data","expectedImpact":"impact"}]}}`;

  const result = await callAidenAPI<AidenChatResponse>(
    "/chat",
    { message, context: { brandsData } },
    300000
  );

  const raw = result.data.content;
  const jsonStr = extractJson(raw);

  JSON.parse(jsonStr);

  return jsonStr;
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
