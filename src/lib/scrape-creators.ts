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
 * Auto-discover the correct Facebook page ID for a brand using the company search API.
 * Returns the best-matching page_id or null.
 */
async function resolvePageId(brandName: string): Promise<string | null> {
  try {
    const result = await searchCompanies(brandName);
    const candidates = result.searchResults || [];
    if (candidates.length === 0) return null;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normalBrand = normalize(brandName);

    const exactMatch = candidates.find((c) => normalize(c.name) === normalBrand);
    if (exactMatch) return exactMatch.page_id;

    const closeMatch = candidates.find((c) => {
      const n = normalize(c.name);
      return n === normalBrand || (n.startsWith(normalBrand) && n.length <= normalBrand.length + 8);
    });
    if (closeMatch) return closeMatch.page_id;

    const bestByLikes = candidates
      .filter((c) => normalize(c.name).includes(normalBrand) || normalBrand.includes(normalize(c.name)))
      .sort((a, b) => b.likes - a.likes)[0];
    if (bestByLikes && bestByLikes.likes > 1000) return bestByLikes.page_id;

    return null;
  } catch {
    return null;
  }
}

/**
 * Collect ads for a brand — resolves the correct Facebook page, then fetches ads by page ID.
 * Falls back to keyword search only as a last resort.
 */
export async function collectAds(brandName: string, country = "US", maxAds = 50, pageId?: string) {
  let rawAds: FacebookAd[] = [];
  let resolvedPageId = pageId || null;

  if (!resolvedPageId) {
    resolvedPageId = await resolvePageId(brandName);
    if (resolvedPageId) {
      console.log(`[ads] Resolved ${brandName} → page_id: ${resolvedPageId}`);
    }
  }

  if (resolvedPageId) {
    try {
      const result = await getCompanyAds({ pageId: resolvedPageId, country, status: "ACTIVE" });
      rawAds = result.results || [];
    } catch { /* fall through */ }
  }

  if (rawAds.length === 0) {
    try {
      const companyResult = await getCompanyAds({ companyName: brandName, country, status: "ACTIVE" });
      rawAds = companyResult.results || [];

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalBrand = normalize(brandName);
      const filtered = rawAds.filter((ad) => {
        const pageName = normalize(ad.page_name || ad.pageName || ad.snapshot?.page_name || "");
        return pageName === normalBrand
          || (pageName.startsWith(normalBrand) && pageName.length <= normalBrand.length + 10)
          || (normalBrand.startsWith(pageName) && pageName.length >= normalBrand.length - 3);
      });
      if (filtered.length > 0) rawAds = filtered;
    } catch { /* fall through */ }
  }

  if (rawAds.length === 0 && !resolvedPageId) {
    try {
      const searchResult = await searchAds({ query: brandName, country, status: "ACTIVE" });
      const candidates = searchResult.searchResults || [];

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalBrand = normalize(brandName);
      rawAds = candidates.filter((ad) => {
        const pageName = normalize(ad.page_name || ad.pageName || ad.snapshot?.page_name || "");
        return pageName === normalBrand
          || (pageName.startsWith(normalBrand) && pageName.length <= normalBrand.length + 6);
      });

      if (rawAds.length === 0) {
        console.log(`[ads] Keyword search for "${brandName}" returned ${candidates.length} results but none from a matching page — discarding to avoid false matches`);
      }
    } catch {
      return [];
    }
  }

  return rawAds.slice(0, maxAds).map((ad) => {
    const imageUrls = extractImageUrls(ad);
    const platforms = (ad.publisher_platform || ad.publisherPlatform || ["facebook"])
      .map((p: string) => p.toLowerCase());
    const format = ad.snapshot?.display_format || "UNKNOWN";
    const hasVideo = !!extractVideoUrl(ad);
    const hasCards = (ad.snapshot?.cards?.length || 0) > 1;

    return {
      adId: getAdId(ad),
      adText: getBodyText(ad.snapshot?.body),
      headline: ad.snapshot?.title || null,
      adImageUrl: imageUrls[0] || null,
      adVideoUrl: extractVideoUrl(ad),
      platforms,
      cta: ad.snapshot?.cta_text || null,
      ctaType: ad.snapshot?.cta_type || null,
      startDate: ad.start_date ? new Date(ad.start_date * 1000).toISOString() : null,
      pageName: getPageName(ad),
      adUrl: ad.url || `https://www.facebook.com/ads/library/?id=${getAdId(ad)}`,
      allImageUrls: imageUrls,
      displayFormat: format,
      linkUrl: ad.snapshot?.link_url || null,
      isVideo: hasVideo || format === "VIDEO",
      isCarousel: hasCards || format === "MULTI_IMAGES",
    };
  });
}

export function computeAdAnalytics(ads: ReturnType<typeof collectAds> extends Promise<infer T> ? T : never) {
  const totalAds = ads.length;
  if (totalAds === 0) {
    return {
      totalAds: 0,
      platformBreakdown: {},
      ctaBreakdown: {},
      formatBreakdown: {},
      videoPercent: 0,
      carouselPercent: 0,
      imagePercent: 0,
      avgCopyLength: 0,
      dateRange: { earliest: null, latest: null },
      topCtas: [],
      topPlatforms: [],
      confirmedPageName: null,
    };
  }

  const platformCounts: Record<string, number> = {};
  const ctaCounts: Record<string, number> = {};
  const formatCounts: Record<string, number> = {};
  let videoCount = 0;
  let carouselCount = 0;
  let imageOnlyCount = 0;
  let totalCopyLength = 0;
  const dates: string[] = [];
  const pageNames: Record<string, number> = {};

  for (const ad of ads) {
    for (const p of ad.platforms) {
      platformCounts[p] = (platformCounts[p] || 0) + 1;
    }
    if (ad.cta) {
      const ctaKey = ad.cta.toUpperCase().replace(/\s+/g, "_");
      ctaCounts[ctaKey] = (ctaCounts[ctaKey] || 0) + 1;
    }
    const fmt = ad.displayFormat || "UNKNOWN";
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;

    if (ad.isVideo) videoCount++;
    else if (ad.isCarousel) carouselCount++;
    else imageOnlyCount++;

    totalCopyLength += ad.adText.length;
    if (ad.startDate) dates.push(ad.startDate);
    if (ad.pageName) {
      pageNames[ad.pageName] = (pageNames[ad.pageName] || 0) + 1;
    }
  }

  dates.sort();

  const topCtas = Object.entries(ctaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cta, count]) => ({ cta, count, percent: Math.round((count / totalAds) * 100) }));

  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([platform, count]) => ({ platform, count, percent: Math.round((count / totalAds) * 100) }));

  const confirmedPageName = Object.entries(pageNames)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalAds,
    platformBreakdown: platformCounts,
    ctaBreakdown: ctaCounts,
    formatBreakdown: formatCounts,
    videoPercent: Math.round((videoCount / totalAds) * 100),
    carouselPercent: Math.round((carouselCount / totalAds) * 100),
    imagePercent: Math.round((imageOnlyCount / totalAds) * 100),
    avgCopyLength: Math.round(totalCopyLength / totalAds),
    dateRange: { earliest: dates[0] || null, latest: dates[dates.length - 1] || null },
    topCtas,
    topPlatforms,
    confirmedPageName,
  };
}
