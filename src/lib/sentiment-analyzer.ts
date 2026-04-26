/**
 * Sentiment Analyzer
 * Takes scraped social posts and uses Claude to analyze:
 * - Per-post sentiment classification
 * - Overall brand perception score
 * - Key themes (positive and negative)
 * - Notable quotes from real people
 * - Conversation topics and pain points
 */

import Anthropic from "@anthropic-ai/sdk";
import { extractAndRepairJson } from "./json-repair";
import type { SocialPost } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface SentimentResult {
  overallScore: number; // -100 to +100
  overallLabel: "very_negative" | "negative" | "mixed" | "neutral" | "positive" | "very_positive";
  totalAnalyzed: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  themes: {
    positive: { theme: string; frequency: string; example: string }[];
    negative: { theme: string; frequency: string; example: string }[];
  };
  notableQuotes: {
    text: string;
    sentiment: "positive" | "negative" | "mixed";
    platform: string;
    author: string;
    context: string;
  }[];
  brandPerception: string;
  reputationRisks: string[];
  advocacyDrivers: string[];
  platformInsights: {
    platform: string;
    dominantSentiment: string;
    keyObservation: string;
  }[];
  posts: AnalyzedPost[];
}

export interface AnalyzedPost extends SocialPost {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sentimentScore: number; // -100 to +100
}

function sanitizeText(text: string): string {
  return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

async function callClaude(brandName: string, postsText: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a brand sentiment analyst. Analyze how the internet talks about "${brandName}" based on these real organic social media posts scraped from TikTok, Instagram, and Reddit.

POSTS:
${postsText}

TASK: Analyze the public perception of "${brandName}" as reflected in these organic conversations. Focus on:
- How real people feel about this brand (not how the brand talks about itself)
- What themes and topics come up repeatedly
- What people love AND hate
- Pain points, complaints, frustrations
- Positive advocacy and loyalty signals
- Reputation risks visible in the conversation

For each post, assign a sentiment: "positive", "negative", "neutral", or "mixed" and a score from -100 to +100.

Respond with ONLY valid JSON:
{
  "overallScore": <number -100 to +100>,
  "overallLabel": "<very_negative|negative|mixed|neutral|positive|very_positive>",
  "sentimentBreakdown": {"positive": <count>, "negative": <count>, "neutral": <count>, "mixed": <count>},
  "themes": {
    "positive": [{"theme": "short label", "frequency": "how common", "example": "verbatim quote from posts"}],
    "negative": [{"theme": "short label", "frequency": "how common", "example": "verbatim quote from posts"}]
  },
  "notableQuotes": [{"text": "verbatim from the post", "sentiment": "positive|negative|mixed", "platform": "tiktok|instagram|reddit", "author": "@handle", "context": "why this quote matters"}],
  "brandPerception": "2-3 sentence summary of how the internet perceives this brand — be honest, cite evidence from the posts",
  "reputationRisks": ["specific risk visible in the conversation data"],
  "advocacyDrivers": ["what makes people defend or recommend this brand"],
  "platformInsights": [{"platform": "tiktok|instagram|reddit", "dominantSentiment": "description", "keyObservation": "what's different about how this platform talks about the brand"}],
  "postSentiments": [{"index": 0, "sentiment": "positive|negative|neutral|mixed", "score": <-100 to 100>}]
}

Be brutally honest. Don't sanitize. If people hate something, say it. If sentiment is mixed, say mixed. Base everything on the actual post content, not assumptions.`,
      },
    ],
  });

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  return textBlocks.map((b) => b.text).join("");
}

function parseClaudeResponse(
  fullText: string,
  posts: SocialPost[],
  postsForAnalysis: SocialPost[],
): SentimentResult {
  const jsonStr = extractAndRepairJson(fullText);
  const parsed = JSON.parse(jsonStr);

  const postSentiments: Map<number, { sentiment: string; score: number }> = new Map();
  for (const ps of parsed.postSentiments || []) {
    postSentiments.set(ps.index, { sentiment: ps.sentiment, score: ps.score });
  }

  const analyzedPosts: AnalyzedPost[] = posts.map((post) => {
    const analysisIndex = postsForAnalysis.indexOf(post);
    const ps = postSentiments.get(analysisIndex);
    return {
      ...post,
      sentiment: (ps?.sentiment as AnalyzedPost["sentiment"]) || "neutral",
      sentimentScore: ps?.score ?? 0,
    };
  });

  return {
    overallScore: parsed.overallScore ?? 0,
    overallLabel: parsed.overallLabel ?? "neutral",
    totalAnalyzed: postsForAnalysis.length,
    sentimentBreakdown: parsed.sentimentBreakdown ?? { positive: 0, negative: 0, neutral: 0, mixed: 0 },
    themes: {
      positive: parsed.themes?.positive ?? [],
      negative: parsed.themes?.negative ?? [],
    },
    notableQuotes: parsed.notableQuotes ?? [],
    brandPerception: parsed.brandPerception ?? "",
    reputationRisks: parsed.reputationRisks ?? [],
    advocacyDrivers: parsed.advocacyDrivers ?? [],
    platformInsights: parsed.platformInsights ?? [],
    posts: analyzedPosts,
  };
}

export async function analyzeSentiment(
  brandName: string,
  posts: SocialPost[],
): Promise<SentimentResult> {
  if (!process.env.ANTHROPIC_API_KEY || posts.length === 0) {
    return emptyResult(posts);
  }

  const textPosts = posts.filter((p) => p.text.length > 10);
  const shortButEngaged = posts
    .filter((p) => p.text.length <= 10 && p.text.length > 0 && (p.likes + p.comments) > 50)
    .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));

  let postsForAnalysis = [...textPosts, ...shortButEngaged].slice(0, 50);

  if (postsForAnalysis.length < 5 && posts.length > 0) {
    const byEngagement = [...posts]
      .sort((a, b) => (b.likes + b.comments + b.views) - (a.likes + a.comments + a.views))
      .slice(0, 30);
    postsForAnalysis = byEngagement;
  }

  if (postsForAnalysis.length === 0) return emptyResult(posts);

  const postsText = postsForAnalysis
    .map((p, i) => {
      const meta = [
        p.platform.toUpperCase(),
        p.author,
        p.subreddit ? `r/${p.subreddit}` : null,
        p.views > 0 ? `${p.views} views` : null,
        p.likes > 0 ? `${p.likes} likes` : null,
        p.comments > 0 ? `${p.comments} comments` : null,
      ].filter(Boolean).join(" | ");
      const rawText = p.text.length > 0 ? p.text : `[Video content by ${p.author}]`;
      return `[${i}] (${meta}) "${sanitizeText(rawText)}"`;
    })
    .join("\n\n");

  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = attempt * 3000;
        console.log(`[sentiment] Retry ${attempt}/${MAX_RETRIES} for ${brandName} after ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
      }

      const fullText = await callClaude(brandName, postsText);
      const result = parseClaudeResponse(fullText, posts, postsForAnalysis);

      const hasRealData = result.overallScore !== 0
        || result.themes.positive.length > 0
        || result.themes.negative.length > 0
        || result.sentimentBreakdown.positive > 0
        || result.sentimentBreakdown.negative > 0;

      if (hasRealData) {
        return result;
      }

      console.warn(`[sentiment] ${brandName} attempt ${attempt}: parsed but no real data, retrying`);
    } catch (error) {
      console.error(`[sentiment] ${brandName} attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
    }
  }

  console.error(`[sentiment] All attempts failed for ${brandName}, returning empty`);
  return emptyResult(posts);
}

function emptyResult(posts: SocialPost[]): SentimentResult {
  return {
    overallScore: 0,
    overallLabel: "neutral",
    totalAnalyzed: 0,
    sentimentBreakdown: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
    themes: { positive: [], negative: [] },
    notableQuotes: [],
    brandPerception: "",
    reputationRisks: [],
    advocacyDrivers: [],
    platformInsights: [],
    posts: posts.map((p) => ({ ...p, sentiment: "neutral" as const, sentimentScore: 0 })),
  };
}
