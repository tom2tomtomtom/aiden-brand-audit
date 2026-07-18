import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdAnalytics } from "@/components/report/AdAnalytics";
import { AdGallery } from "@/components/report/AdGallery";
import { BrandIntel } from "@/components/report/BrandIntel";
import type { BrandData } from "@/lib/types";

function brand(name: string): BrandData {
  return {
    name,
    website: "https://example.com",
    logos: { primaryLogo: null, logoVariants: [], favicon: null, brandName: name },
    ads: [],
    adCreativeUrls: [],
    colors: null,
    adColors: null,
    analytics: {
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
    },
    intel: {
      pressReleases: [],
      pressCoverage: [{
        title: "Coverage",
        source: "Publisher",
        url: "https://example.com/coverage",
        date: "2026-07-18",
        summary: "Summary",
      }],
      activations: [],
      brandDocuments: [],
      socialPresence: [],
      recentCampaigns: [],
      citations: [],
    },
    social: null,
  };
}

describe("single-brand report controls", () => {
  it.each([
    ["Ad Analytics", AdAnalytics],
    ["Ad Gallery", AdGallery],
    ["Brand Intel", BrandIntel],
  ])("hides the %s brand picker when there is only one brand", (_name, Component) => {
    const html = renderToStaticMarkup(<Component brands={[brand("Only Brand")]} />);

    expect(html).not.toContain("<select");
    expect(html).not.toContain("All Brands");
  });

  it.each([
    ["Ad Analytics", AdAnalytics],
    ["Ad Gallery", AdGallery],
    ["Brand Intel", BrandIntel],
  ])("keeps the %s brand picker for comparisons", (_name, Component) => {
    const html = renderToStaticMarkup(
      <Component brands={[brand("Brand One"), brand("Brand Two")]} />,
    );

    expect(html).toContain("<select");
    expect(html).toContain("All Brands");
  });
});
