/**
 * ScrapeCreators Facebook Ad Library API Client
 *
 * Direct API access to Facebook Ad Library data — no Playwright, no Apify polling.
 * Ported from aiden-creative-agent.
 */

const API_BASE = "https://api.scrapecreators.com/v1/facebook/adLibrary";

function getApiKey(): string {
  const key = process.env.SCRAPE_CREATORS_API_KEY;
  if (!key) throw new Error("SCRAPE_CREATORS_API_KEY not configured");
  return key;
}

function buildUrl<T extends object>(endpoint: string, params: T): string {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
}

async function makeRequest<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ScrapeCreators API ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// --- Types ---

export interface AdImage {
  original_image_url: string;
  resized_image_url: string;
}

export interface AdVideo {
  video_hd_url?: string;
  video_sd_url?: string;
  video_preview_image_url?: string;
}

export interface AdCard {
  title?: string;
  body?: string;
  link_url?: string;
  cta_text?: string;
  cta_type?: string;
  original_image_url?: string;
  video_hd_url?: string;
  video_sd_url?: string;
}

export interface AdSnapshot {
  body: { text: string } | string | null;
  title: string | null;
  caption: string | null;
  cta_text: string | null;
  cta_type: string | null;
  display_format: string;
  link_url: string | null;
  page_name: string;
  page_id: string | number;
  page_profile_picture_url: string;
  images: AdImage[];
  videos: AdVideo[];
  cards: AdCard[];
  extra_images: AdImage[];
  extra_videos: AdVideo[];
}

export interface FacebookAd {
  adArchiveID?: number;
  ad_archive_id?: string;
  ad_id?: string | null;
  page_name?: string;
  pageName?: string;
  snapshot: AdSnapshot;
  publisher_platform?: string[];
  publisherPlatform?: string[];
  start_date?: number;
  startDate?: number;
  end_date?: number;
  is_active?: boolean;
  isActive?: boolean;
  url?: string;
}

export interface SearchAdsResponse {
  searchResults: FacebookAd[];
  searchResultsCount: number;
  cursor: string | null;
}

export interface CompanyAdsResponse {
  results: FacebookAd[];
  cursor: string | null;
}

export interface CompanyResult {
  page_id: string;
  name: string;
  page_alias: string;
  category: string;
  likes: number;
  image_uri: string;
}

export interface SearchCompaniesResponse {
  searchResults: CompanyResult[];
}

// --- Public API ---

export async function searchAds(params: {
  query: string;
  country?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  media_type?: string;
}): Promise<SearchAdsResponse> {
  const url = buildUrl("/search/ads", params);
  return makeRequest<SearchAdsResponse>(url);
}

export async function getCompanyAds(params: {
  companyName?: string;
  pageId?: string;
  country?: string;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
}): Promise<CompanyAdsResponse> {
  const url = buildUrl("/company/ads", params);
  return makeRequest<CompanyAdsResponse>(url);
}

export async function searchCompanies(query: string): Promise<SearchCompaniesResponse> {
  const url = buildUrl("/search/companies", { query });
  return makeRequest<SearchCompaniesResponse>(url);
}

// --- Media extraction ---

function getBodyText(body: AdSnapshot["body"]): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (typeof body === "object" && "text" in body) return body.text;
  return "";
}

function getAdId(ad: FacebookAd): string {
  return String(ad.ad_archive_id || ad.adArchiveID || "unknown");
}

function getPageName(ad: FacebookAd): string {
  return ad.page_name || ad.pageName || ad.snapshot?.page_name || "Unknown";
}

/**
 * Extract all image URLs from a single ad (main + cards + extras), deduplicated.
 */
function extractImageUrls(ad: FacebookAd): string[] {
  const urls = new Set<string>();
  const s = ad.snapshot;
  if (!s) return [];

  for (const img of s.images || []) {
    if (img.original_image_url) urls.add(img.original_image_url);
  }
  for (const img of s.extra_images || []) {
    if (img.original_image_url) urls.add(img.original_image_url);
  }
  for (const card of s.cards || []) {
    if (card.original_image_url) urls.add(card.original_image_url);
  }

  return Array.from(urls);
}

/**
 * Extract the first video URL from an ad.
 */
function extractVideoUrl(ad: FacebookAd): string | null {
  const s = ad.snapshot;
  if (!s) return null;

  for (const v of s.videos || []) {
    if (v.video_hd_url) return v.video_hd_url;
    if (v.video_sd_url) return v.video_sd_url;
  }
  for (const v of s.extra_videos || []) {
    if (v.video_hd_url) return v.video_hd_url;
    if (v.video_sd_url) return v.video_sd_url;
  }
  for (const card of s.cards || []) {
    if (card.video_hd_url) return card.video_hd_url;
    if (card.video_sd_url) return card.video_sd_url;
  }

  return null;
}

/**
 * Collect ads for a brand — tries company lookup first, falls back to keyword search.
 * Returns normalized BrandAd-compatible objects.
 */
export async function collectAds(brandName: string, country = "US", maxAds = 50) {
  let rawAds: FacebookAd[] = [];

  try {
    const companyResult = await getCompanyAds({ companyName: brandName, country, status: "ACTIVE" });
    rawAds = companyResult.results || [];
  } catch {
    // Fall back to keyword search
  }

  if (rawAds.length === 0) {
    try {
      const searchResult = await searchAds({ query: brandName, country, status: "ACTIVE" });
      rawAds = searchResult.searchResults || [];
    } catch {
      return [];
    }
  }

  return rawAds.slice(0, maxAds).map((ad) => {
    const imageUrls = extractImageUrls(ad);
    const platforms = (ad.publisher_platform || ad.publisherPlatform || ["facebook"])
      .map((p: string) => p.toLowerCase());

    return {
      adId: getAdId(ad),
      adText: getBodyText(ad.snapshot?.body),
      adImageUrl: imageUrls[0] || null,
      adVideoUrl: extractVideoUrl(ad),
      platforms,
      cta: ad.snapshot?.cta_text || null,
      startDate: ad.start_date ? new Date(ad.start_date * 1000).toISOString() : null,
      pageName: getPageName(ad),
      adUrl: ad.url || `https://www.facebook.com/ads/library/?id=${getAdId(ad)}`,
      allImageUrls: imageUrls,
    };
  });
}
