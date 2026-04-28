/**
 * Social Media Scraper
 * Scrapes TikTok, Instagram, and Reddit via ScrapeCreators API
 * to gather organic social conversation data for brand analysis.
 */

const API_BASE = "https://api.scrapecreators.com/v1";

function getApiKey(): string {
  const key = process.env.SCRAPE_CREATORS_API_KEY;
  if (!key) throw new Error("SCRAPE_CREATORS_API_KEY not configured");
  return key;
}

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`ScrapeCreators ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

// --- TikTok ---

interface TikTokRawPost {
  aweme_id: string;
  desc: string;
  region: string;
  author: { unique_id: string; nickname: string };
  statistics: {
    play_count: number;
    digg_count: number;
    share_count: number;
    comment_count: number;
  };
}

interface TikTokResponse {
  success: boolean;
  aweme_list: TikTokRawPost[];
}

export async function scrapeTikTok(brandName: string): Promise<SocialPost[]> {
  const hashtag = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const url = `${API_BASE}/tiktok/search/hashtag?hashtag=${encodeURIComponent(hashtag)}&region=US&trim=true`;

  try {
    const data = await fetchApi<TikTokResponse>(url);
    return (data.aweme_list || []).slice(0, 20).map((p) => ({
      platform: "tiktok" as const,
      id: p.aweme_id,
      author: `@${sanitize(p.author.unique_id)}`,
      text: sanitize(p.desc).slice(0, 500),
      url: `https://www.tiktok.com/@${p.author.unique_id}/video/${p.aweme_id}`,
      views: p.statistics.play_count,
      likes: p.statistics.digg_count,
      shares: p.statistics.share_count,
      comments: p.statistics.comment_count,
      region: p.region,
    }));
  } catch (e) {
    console.error(`[social] TikTok scrape failed for ${brandName}:`, e);
    return [];
  }
}

// --- Instagram ---

interface InstagramRawPost {
  pk: string;
  caption?: { text?: string } | null;
  user?: { username?: string } | null;
  like_count?: number;
  comment_count?: number;
  play_count?: number;
  code?: string;
}

interface InstagramResponse {
  success: boolean;
  posts: InstagramRawPost[];
}

export async function scrapeInstagram(brandName: string): Promise<SocialPost[]> {
  const hashtag = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const url = `${API_BASE}/instagram/search/hashtag?hashtag=${encodeURIComponent(hashtag)}&trim=true`;

  try {
    const data = await fetchApi<InstagramResponse>(url);
    return (data.posts || []).slice(0, 20).map((p) => {
      const captionText = typeof p.caption === "object" && p.caption?.text
        ? p.caption.text
        : "";
      const username = typeof p.user === "object" ? p.user?.username || "unknown" : "unknown";
      const postUrl = p.code
        ? `https://www.instagram.com/p/${p.code}/`
        : `https://www.instagram.com/p/${p.pk}/`;

      return {
        platform: "instagram" as const,
        id: String(p.pk),
        author: `@${sanitize(username)}`,
        text: sanitize(captionText).slice(0, 500),
        url: postUrl,
        views: p.play_count || 0,
        likes: p.like_count || 0,
        shares: 0,
        comments: p.comment_count || 0,
      };
    });
  } catch (e) {
    console.error(`[social] Instagram scrape failed for ${brandName}:`, e);
    return [];
  }
}

// --- Reddit ---

interface RedditRawPost {
  id: string;
  author: string;
  subreddit: string;
  title: string;
  selftext?: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  url: string;
  created_utc?: number;
}

interface RedditResponse {
  success: boolean;
  posts: RedditRawPost[];
}

export async function scrapeReddit(brandName: string): Promise<SocialPost[]> {
  const url = `${API_BASE}/reddit/search?query=${encodeURIComponent(brandName)}&trim=true`;

  try {
    const data = await fetchApi<RedditResponse>(url);
    return (data.posts || []).slice(0, 20).map((p) => {
      const selftext = p.selftext?.slice(0, 400) || "";
      const fullText = selftext
        ? `${p.title}: ${selftext}`
        : p.title;

      return {
        platform: "reddit" as const,
        id: p.id,
        author: `u/${sanitize(p.author)}`,
        text: sanitize(fullText).slice(0, 500),
        url: p.url.startsWith("http") ? p.url : `https://www.reddit.com${p.url}`,
        views: 0,
        likes: p.score,
        shares: 0,
        comments: p.num_comments,
        subreddit: p.subreddit,
        upvoteRatio: p.upvote_ratio,
      };
    });
  } catch (e) {
    console.error(`[social] Reddit scrape failed for ${brandName}:`, e);
    return [];
  }
}

// --- Helpers ---

import type { SocialPost, SocialSentiment } from "./types";

function sanitize(text: string): string {
  return text
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function computeEngagement(post: SocialPost): number {
  return post.likes + post.comments + post.shares;
}

// --- Main collector ---

export async function collectSocialPosts(brandName: string): Promise<SocialPost[]> {
  const [tiktok, instagram, reddit] = await Promise.all([
    scrapeTikTok(brandName),
    scrapeInstagram(brandName),
    scrapeReddit(brandName),
  ]);
  return [...tiktok, ...instagram, ...reddit];
}

export async function collectSocialSentiment(brandName: string): Promise<SocialSentiment> {
  const [tiktok, instagram, reddit] = await Promise.all([
    scrapeTikTok(brandName),
    scrapeInstagram(brandName),
    scrapeReddit(brandName),
  ]);

  const allPosts = [...tiktok, ...instagram, ...reddit];
  const totalEngagement = allPosts.reduce((sum, p) => sum + computeEngagement(p), 0);

  const platforms = [
    { platform: "tiktok", posts: tiktok },
    { platform: "instagram", posts: instagram },
    { platform: "reddit", posts: reddit },
  ];

  const platformBreakdown = platforms.map(({ platform, posts }) => ({
    platform,
    posts: posts.length,
    engagement: posts.reduce((sum, p) => sum + computeEngagement(p), 0),
  }));

  const topPost = allPosts.length > 0
    ? allPosts.reduce((best, p) => computeEngagement(p) > computeEngagement(best) ? p : best)
    : null;

  return {
    tiktok,
    instagram,
    reddit,
    sentiment: null,
    summary: {
      totalPosts: allPosts.length,
      totalEngagement,
      platformBreakdown,
      topPost,
    },
  };
}
