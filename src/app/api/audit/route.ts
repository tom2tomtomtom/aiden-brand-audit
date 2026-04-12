import { NextRequest } from "next/server";
import { collectLogos } from "@/lib/apify";
import { collectAds } from "@/lib/scrape-creators";
import { extractColors } from "@/lib/colors";
import { analyzeWithAiden } from "@/lib/aiden-api";
import type { BrandConfig, BrandData, AuditResults, ProgressEvent } from "@/lib/types";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { brands } = (await request.json()) as { brands: BrandConfig[] };

  if (!brands || brands.length === 0) {
    return new Response(JSON.stringify({ error: "No brands provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: ProgressEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      const startTime = Date.now();
      const brandsData: BrandData[] = [];

      try {
        const totalBrands = brands.length;

        for (let i = 0; i < totalBrands; i++) {
          const brand = brands[i];
          const brandProgress = (i / totalBrands) * 80;

          // Collect logos
          send({
            type: "progress",
            step: `Discovering logos for ${brand.name}`,
            progress: brandProgress + 5,
            detail: `Scanning ${brand.website}`,
          });

          let logos;
          try {
            logos = await collectLogos(brand.website);
          } catch {
            logos = { primaryLogo: null, logoVariants: [], favicon: null, brandName: brand.name };
          }

          // Collect ads
          send({
            type: "progress",
            step: `Scraping Facebook ads for ${brand.name}`,
            progress: brandProgress + 20,
            detail: "Querying Facebook Ad Library via ScrapeCreators",
          });

          let ads: Awaited<ReturnType<typeof collectAds>> = [];
          try {
            ads = await collectAds(brand.facebookPage || brand.name, "US", 50);
          } catch {
            ads = [];
          }

          // Extract colors from logo
          send({
            type: "progress",
            step: `Extracting color DNA for ${brand.name}`,
            progress: brandProgress + 35,
          });

          let colors = null;
          if (logos.primaryLogo) {
            try {
              colors = await extractColors(logos.primaryLogo);
            } catch {
              // Color extraction failed
            }
          }

          // Collect screenshots of ad URLs
          const screenshots: string[] = [];
          const adImages = ads
            .map((a) => a.adImageUrl)
            .filter(Boolean)
            .slice(0, 12) as string[];

          send({
            type: "progress",
            step: `Capturing ${brand.name} ad creatives`,
            progress: brandProgress + 50,
            detail: `${adImages.length} ad images found`,
          });

          brandsData.push({
            name: brand.name,
            website: brand.website,
            logos,
            ads,
            screenshots: adImages.length > 0 ? adImages : screenshots,
            colors,
          });
        }

        // Strategic analysis with AIDEN
        send({
          type: "progress",
          step: "AIDEN analyzing competitive landscape",
          progress: 85,
          detail: "Phantom brain processing strategic intelligence",
        });

        let strategicAnalysis;
        try {
          const summaries = brandsData.map((b) => ({
            name: b.name,
            adCount: b.ads.length,
            screenshotCount: b.screenshots.length,
            primaryColors: b.colors?.primaryColors || [],
            adThemes: b.ads.slice(0, 10).map((a) => a.adText.slice(0, 200)),
          }));

          const analysisJson = await analyzeWithAiden(summaries);
          strategicAnalysis = JSON.parse(analysisJson);
        } catch (e) {
          strategicAnalysis = {
            executiveSummary: {
              overview: "Strategic analysis could not be completed. Please check your AIDEN API configuration.",
              keyFindings: ["Analysis pending"],
              strategicImplications: "Retry with valid AIDEN API credentials.",
            },
            visualDna: { colorStrategies: {}, visualDifferentiation: "", sharedPatterns: [], uniqueElements: {} },
            creativeDna: { messagingThemes: {}, toneAndVoice: {}, creativeDirections: {} },
            strategicSynthesis: {
              competitivePositioning: {},
              whiteSpaceOpportunities: [],
              recommendedActions: [],
            },
          };
        }

        const duration = Date.now() - startTime;

        send({
          type: "progress",
          step: "Compiling intelligence report",
          progress: 95,
        });

        const results: AuditResults = {
          brands: brandsData,
          strategicAnalysis,
          duration,
        };

        send({ type: "complete", results });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
