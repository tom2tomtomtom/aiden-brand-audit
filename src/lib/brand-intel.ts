import Anthropic from "@anthropic-ai/sdk";
import { extractAndRepairJson } from "./json-repair";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface BrandIntelResult {
  pressReleases: { title: string; source: string; url: string; date: string; summary: string }[];
  pressCoverage: { title: string; source: string; url: string; date: string; summary: string }[];
  activations: { title: string; description: string; url: string; date: string }[];
  brandDocuments: { title: string; type: string; url: string; summary: string }[];
  socialPresence: { platform: string; handle: string; url: string; followers?: string }[];
  recentCampaigns: { name: string; description: string; url: string; date: string }[];
  citations: { url: string; title: string }[];
}

export async function gatherBrandIntel(brandName: string, website: string): Promise<BrandIntelResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return emptyResult();
  }

  try {
    console.log(`[brand-intel] Researching ${brandName} via Claude web search...`);
    const response = await client.beta.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      betas: ["web-search-2025-03-05"],
      tools: [
        {
          type: "web_search_20250305" as const,
          name: "web_search",
          max_uses: 10,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Research the brand "${brandName}" (website: ${website}). Search for:

1. PRESS RELEASES — official announcements, product launches, partnerships
2. PRESS COVERAGE — news articles, media mentions, interviews, reviews
3. BRAND ACTIVATIONS — events, sponsorships, experiential marketing, pop-ups, collaborations
4. BRAND DOCUMENTS — brand guidelines, annual reports, investor presentations, public strategy docs
5. SOCIAL PRESENCE — official accounts on Instagram, TikTok, X/Twitter, YouTube, LinkedIn
6. RECENT CAMPAIGNS — advertising campaigns, marketing initiatives, creative work from the last 12 months

Search thoroughly — try multiple queries to cover different angles.

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "pressReleases": [{"title": "...", "source": "...", "url": "...", "date": "YYYY-MM or approximate", "summary": "1-2 sentences"}],
  "pressCoverage": [{"title": "...", "source": "...", "url": "...", "date": "YYYY-MM or approximate", "summary": "1-2 sentences"}],
  "activations": [{"title": "...", "description": "...", "url": "...", "date": "YYYY-MM or approximate"}],
  "brandDocuments": [{"title": "...", "type": "guidelines|annual-report|investor-deck|strategy|other", "url": "...", "summary": "1-2 sentences"}],
  "socialPresence": [{"platform": "...", "handle": "@...", "url": "...", "followers": "approximate count or empty"}],
  "recentCampaigns": [{"name": "...", "description": "1-2 sentences", "url": "...", "date": "YYYY-MM or approximate"}],
  "citations": [{"url": "...", "title": "..."}]
}

Include ONLY items you actually found with real URLs. Do not fabricate entries. If a category has no results, use an empty array.`,
        },
      ],
    });

    const textBlocks = response.content.filter(
      (block) => block.type === "text"
    );

    const fullText = textBlocks
      .map((b) => ("text" in b ? (b as { text: string }).text : ""))
      .join("");
    console.log(`[brand-intel] Got ${fullText.length} chars response for ${brandName}`);

    const citations: { url: string; title: string }[] = [];
    for (const block of textBlocks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyBlock = block as any;
      if (anyBlock.citations && Array.isArray(anyBlock.citations)) {
        for (const cite of anyBlock.citations) {
          if (cite.type === "web_search_result_location" && cite.url) {
            citations.push({ url: cite.url, title: cite.title || "" });
          }
        }
      }
    }

    const jsonStr = extractAndRepairJson(fullText);
    const parsed = JSON.parse(jsonStr) as BrandIntelResult;

    if (citations.length > 0) {
      const existingUrls = new Set((parsed.citations || []).map((c) => c.url));
      for (const c of citations) {
        if (!existingUrls.has(c.url)) {
          parsed.citations.push(c);
        }
      }
    }

    console.log(`[brand-intel] ${brandName}: ${parsed.pressCoverage.length} press, ${parsed.activations.length} activations, ${parsed.recentCampaigns.length} campaigns`);
    return parsed;
  } catch (error) {
    console.error(`[brand-intel] Failed for ${brandName}:`, error instanceof Error ? error.message : error);
    return emptyResult();
  }
}

function emptyResult(): BrandIntelResult {
  return {
    pressReleases: [],
    pressCoverage: [],
    activations: [],
    brandDocuments: [],
    socialPresence: [],
    recentCampaigns: [],
    citations: [],
  };
}
