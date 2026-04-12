const APIFY_BASE = "https://api.apify.com/v2";

interface ApifyRunResult<T> {
  items: T[];
}

async function runApifyActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) throw new Error("APIFY_API_KEY not configured");

  const runResponse = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!runResponse.ok) {
    throw new Error(`Apify actor run failed: ${runResponse.status}`);
  }

  const run = await runResponse.json();
  const runId = run.data?.id;
  if (!runId) throw new Error("No run ID returned from Apify");

  // Poll until finished
  let status = "RUNNING";
  while (status === "RUNNING" || status === "READY") {
    await new Promise((r) => setTimeout(r, 3000));
    const statusResponse = await fetch(
      `${APIFY_BASE}/acts/${actorId}/runs/${runId}?token=${apiKey}`
    );
    const statusData = await statusResponse.json();
    status = statusData.data?.status || "FAILED";
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify actor run status: ${status}`);
  }

  const datasetId = run.data?.defaultDatasetId;
  if (!datasetId) throw new Error("No dataset ID from Apify run");

  const dataResponse = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${apiKey}`
  );
  const items = await dataResponse.json();
  return Array.isArray(items) ? items : [];
}

export interface RawLogoResult {
  logo_url?: string;
  logoUrl?: string;
  favicon_url?: string;
  faviconUrl?: string;
  brand_name?: string;
  title?: string;
}

export async function collectLogos(website: string) {
  const items = await runApifyActor<RawLogoResult>(
    "coder_luffy/website-logo-finder",
    { input_url: website }
  );

  const logos = items.flatMap((item) => [item.logo_url, item.logoUrl].filter(Boolean) as string[]);
  const uniqueLogos = [...new Set(logos)].slice(0, 6);

  return {
    primaryLogo: uniqueLogos[0] || null,
    logoVariants: uniqueLogos,
    favicon: items[0]?.favicon_url || items[0]?.faviconUrl || null,
    brandName: items[0]?.brand_name || items[0]?.title || null,
  };
}

export interface RawAdResult {
  id?: string;
  ad_id?: string;
  adText?: string;
  ad_creative_bodies?: string[];
  adImageUrl?: string;
  ad_creative_link_captions?: string[];
  snapshot?: { images?: { original_image_url?: string }[]; videos?: { video_sd_url?: string }[] };
  videoUrl?: string;
  publisherPlatforms?: string[];
  platforms?: string[];
  callToAction?: string;
  cta_text?: string;
  startDate?: string;
  ad_delivery_start_time?: string;
  pageName?: string;
  page_name?: string;
  adArchiveURL?: string;
  ad_snapshot_url?: string;
}

export async function collectAds(brandName: string, country = "US", maxAds = 50) {
  const items = await runApifyActor<RawAdResult>(
    "scrapestorm/facebook-ads-library-scraper---fast-cheap",
    { keyword: brandName, country, max_items: maxAds }
  );

  return items.map((item) => {
    const imageUrl = item.adImageUrl
      || item.snapshot?.images?.[0]?.original_image_url
      || null;

    const videoUrl = item.videoUrl
      || item.snapshot?.videos?.[0]?.video_sd_url
      || null;

    const platforms = (item.publisherPlatforms || item.platforms || ["facebook"])
      .map((p: string) => p.toLowerCase());

    return {
      adId: item.id || item.ad_id || crypto.randomUUID(),
      adText: item.adText || item.ad_creative_bodies?.[0] || "",
      adImageUrl: imageUrl,
      adVideoUrl: videoUrl,
      platforms,
      cta: item.callToAction || item.cta_text || null,
      startDate: item.startDate || item.ad_delivery_start_time || null,
      pageName: item.pageName || item.page_name || null,
      adUrl: item.adArchiveURL || item.ad_snapshot_url || null,
    };
  });
}
