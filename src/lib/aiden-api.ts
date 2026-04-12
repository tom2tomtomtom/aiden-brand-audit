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

export async function analyzeWithAiden(brandsData: {
  name: string;
  adCount: number;
  screenshotCount: number;
  primaryColors: string[];
  adThemes: string[];
}[]): Promise<string> {
  const brandSummary = brandsData
    .map((b) => `Brand: ${b.name}\n- ${b.adCount} ads collected\n- ${b.screenshotCount} screenshots\n- Colors: ${b.primaryColors.join(", ")}\n- Ad themes: ${b.adThemes.slice(0, 5).join("; ")}`)
    .join("\n\n");

  const message = `You are an expert brand strategist conducting a competitive brand DNA analysis.

Analyze these brands and produce a comprehensive competitive intelligence report:

${brandSummary}

Respond with JSON in this exact structure:
{
  "executiveSummary": {
    "overview": "2-3 sentence overview",
    "keyFindings": ["finding 1", "finding 2", "finding 3"],
    "strategicImplications": "paragraph on implications"
  },
  "visualDna": {
    "colorStrategies": {"BrandName": "description"},
    "visualDifferentiation": "paragraph",
    "sharedPatterns": ["pattern 1"],
    "uniqueElements": {"BrandName": ["element 1"]}
  },
  "creativeDna": {
    "messagingThemes": {"BrandName": ["theme 1"]},
    "toneAndVoice": {"BrandName": "description"},
    "creativeDirections": {"BrandName": ["direction 1"]}
  },
  "strategicSynthesis": {
    "competitivePositioning": {"BrandName": {"strengths": [], "weaknesses": [], "marketPosition": ""}},
    "whiteSpaceOpportunities": ["opp 1"],
    "recommendedActions": [{"action": "", "rationale": "", "expectedImpact": ""}]
  }
}

Return ONLY the JSON object, no markdown fences.`;

  const result = await callAidenAPI<AidenChatResponse>(
    "/chat",
    { message, context: { brandsData } },
    300000
  );

  return result.data.content;
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
