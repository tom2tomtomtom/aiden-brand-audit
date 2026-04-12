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

  const message = `TASK: Produce a competitive brand DNA analysis as a JSON object.

DATA:
${brandSummary}

INSTRUCTIONS:
- You MUST respond with ONLY a valid JSON object. No text before or after.
- No markdown fences. No explanation. Just the JSON.
- Use the brand names from the data as keys.

REQUIRED JSON STRUCTURE:
{"executiveSummary":{"overview":"2-3 sentence competitive overview","keyFindings":["finding1","finding2","finding3","finding4","finding5"],"strategicImplications":"paragraph on strategic implications"},"visualDna":{"colorStrategies":{"BrandName":"color strategy description"},"visualDifferentiation":"paragraph on visual differences","sharedPatterns":["shared pattern 1","shared pattern 2"],"uniqueElements":{"BrandName":["unique element 1","unique element 2"]}},"creativeDna":{"messagingThemes":{"BrandName":["theme 1","theme 2"]},"toneAndVoice":{"BrandName":"tone description"},"creativeDirections":{"BrandName":["direction 1","direction 2"]}},"strategicSynthesis":{"competitivePositioning":{"BrandName":{"strengths":["s1","s2"],"weaknesses":["w1","w2"],"marketPosition":"position description"}},"whiteSpaceOpportunities":["opportunity 1","opportunity 2"],"recommendedActions":[{"action":"action","rationale":"why","expectedImpact":"impact"}]}}`;

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
