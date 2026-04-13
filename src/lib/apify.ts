function domainFromUrl(website: string): string {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

async function scrapeMetaImages(website: string): Promise<{ ogImage: string | null; touchIcon: string | null }> {
  const url = website.startsWith("http") ? website : `https://${website}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandAuditBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ogImage: null, touchIcon: null };

    const html = await res.text();

    const ogMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const ogImage = ogMatch?.[1] ? resolveUrl(ogMatch[1], url) : null;

    const touchMatch = html.match(/rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i);
    const touchIcon = touchMatch?.[1] ? resolveUrl(touchMatch[1], url) : null;

    return { ogImage, touchIcon };
  } catch {
    return { ogImage: null, touchIcon: null };
  }
}

export async function collectLogos(website: string) {
  const domain = domainFromUrl(website);
  const logos: string[] = [];

  const [metaImages] = await Promise.all([
    scrapeMetaImages(website),
  ]);

  if (metaImages.touchIcon) logos.push(metaImages.touchIcon);

  const faviconIm = `https://favicon.im/${domain}`;
  try {
    const probe = await fetch(faviconIm, { method: "HEAD", signal: AbortSignal.timeout(4000) });
    if (probe.ok && Number(probe.headers.get("content-length") || 0) > 1000) {
      logos.push(faviconIm);
    }
  } catch { /* unavailable */ }

  if (metaImages.ogImage) logos.push(metaImages.ogImage);

  const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  logos.push(googleFavicon);

  const uniqueLogos = [...new Set(logos)];

  return {
    primaryLogo: uniqueLogos[0] || null,
    logoVariants: uniqueLogos,
    favicon: googleFavicon,
    brandName: null,
    brandColors: null,
  };
}
