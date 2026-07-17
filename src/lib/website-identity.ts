import { safeFetchHtml } from "./url-guard";
import { resolvePageIdByAlias } from "./scrape-creators";

export interface WebsiteIdentity {
  siteName: string | null;
  description: string | null;
  facebookHandle: string | null;
  facebookPageId: string | null;
}

// UXA-20260717 F-028: derive the advertiser's country from the website so the
// Meta Ad Library search is geo-scoped. An unscoped ("ALL") name search
// matched an overseas clothing brand for an Australian dairy brand of a
// similar name. ccTLD → ISO-3166 alpha-2. Generic gTLDs (.com/.org/.io…)
// return null → caller keeps "ALL".
const CCTLD_COUNTRY: Record<string, string> = {
  au: "AU", nz: "NZ", uk: "GB", ca: "CA", ie: "IE", in: "IN", sg: "SG",
  za: "ZA", de: "DE", fr: "FR", es: "ES", it: "IT", nl: "NL", se: "SE",
  no: "NO", dk: "DK", fi: "FI", ch: "CH", at: "AT", be: "BE", pt: "PT",
  br: "BR", mx: "MX", jp: "JP", kr: "KR", ae: "AE", us: "US",
};

export function countryFromWebsite(website: string): string | undefined {
  if (!website) return undefined;
  let host: string;
  try {
    const withProto = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    host = new URL(withProto).hostname.toLowerCase();
  } catch {
    host = website.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  }
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  // Second-level ccTLDs like .com.au / .co.uk / .co.nz — the ccTLD is last.
  return CCTLD_COUNTRY[tld] ?? undefined;
}

const FB_HANDLE_BLOCKLIST = new Set([
  "sharer", "dialog", "plugins", "tr", "share.php", "groups", "events",
  "intent", "home.php", "login", "watch", "gaming", "marketplace",
  "business", "help", "policies", "settings", "terms", "privacy",
  "profile.php", "people", "directory", "ads", "permalink.php",
  "messages", "stories", "reel", "reels", "video", "videos",
]);

function extractFacebookFromHtml(html: string): { handle: string | null; pageId: string | null } {
  // pages/Name/123456789 → numeric page_id is authoritative
  const pagesMatch = /facebook\.com\/pages\/[^/"'\s<>?#]+\/(\d{6,})/i.exec(html);
  if (pagesMatch) return { handle: null, pageId: pagesMatch[1] };

  const handleRe = /facebook\.com\/([A-Za-z0-9.\-_]{2,})/gi;
  for (const m of html.matchAll(handleRe)) {
    const raw = m[1];
    const candidate = raw.toLowerCase();
    if (FB_HANDLE_BLOCKLIST.has(candidate)) continue;
    // Legacy unclaimed-page format: "Slug-Name-123456789012345" where
    // the trailing 12-16 digit run is the actual page_id. The slug
    // can't be searched via searchCompanies, so pull the id directly.
    const trailingId = /-(\d{12,16})$/.exec(raw);
    if (trailingId) return { handle: null, pageId: trailingId[1] };
    return { handle: candidate, pageId: null };
  }
  return { handle: null, pageId: null };
}

function extractMetaAndTitle(html: string): { siteName: string | null; description: string | null } {
  let siteName: string | null = null;
  let ogTitle: string | null = null;
  let description: string | null = null;

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const prop = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (!prop || !content) continue;
    if (prop === "og:site_name" && !siteName) siteName = content;
    if (prop === "og:title" && !ogTitle) ogTitle = content;
    if ((prop === "og:description" || prop === "description") && !description) description = content;
  }

  if (!siteName) {
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    siteName = titleMatch?.[1]?.trim() || ogTitle;
  }

  return { siteName, description };
}

/**
 * Fetch a brand website and extract identity signals: real site name,
 * description, and (most importantly) the Facebook page linked from
 * the site. Used to disambiguate brands with generic names ("the memo",
 * "moment", "spring") from unrelated FB pages that happen to share the
 * keyword.
 *
 * Returns nulls for any signal not found. Never throws.
 */
export async function resolveWebsiteIdentity(website: string): Promise<WebsiteIdentity> {
  const empty: WebsiteIdentity = {
    siteName: null,
    description: null,
    facebookHandle: null,
    facebookPageId: null,
  };
  const fetched = await safeFetchHtml(website).catch(() => null);
  if (!fetched) return empty;

  const html = fetched.text;
  const { siteName, description } = extractMetaAndTitle(html);
  const fb = extractFacebookFromHtml(html);

  let facebookPageId = fb.pageId;
  const facebookHandle = fb.handle;

  if (!facebookPageId && facebookHandle) {
    facebookPageId = await resolvePageIdByAlias(facebookHandle).catch(() => null);
  }

  return { siteName, description, facebookHandle, facebookPageId };
}
