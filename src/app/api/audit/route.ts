import { NextRequest } from "next/server";
import { collectLogos } from "@/lib/apify";
import { collectAds, computeAdAnalytics } from "@/lib/scrape-creators";
import { collectSocialPosts } from "@/lib/social-scraper";
import { analyzeSentiment } from "@/lib/sentiment-analyzer";
import { extractColors } from "@/lib/colors";
import { analyzeWithAiden } from "@/lib/aiden-api";
import { gatherBrandIntel } from "@/lib/brand-intel";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { canRunAudit, incrementUsage, getUserPlan } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rate-limit";
import type { BrandConfig, BrandData, AuditResults, ProgressEvent } from "@/lib/types";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { allowed: rateLimitAllowed } = checkRateLimit(auth.user.id, 3, 60_000);
  if (!rateLimitAllowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const supabase = createServiceClient();
  if (supabase) {
    const { allowed, planLimits } = await canRunAudit(supabase, auth.user.id);
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Usage limit reached",
          plan: planLimits.plan,
          used: planLimits.used,
          limit: planLimits.limit,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const { brands } = (await request.json()) as { brands: BrandConfig[] };

  if (!brands || brands.length === 0) {
    return new Response(JSON.stringify({ error: "No brands provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (supabase) {
    const plan = await getUserPlan(supabase, auth.user.id);
    await incrementUsage(supabase, auth.user.id, plan);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: ProgressEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }

      // Keepalive to prevent proxy idle-connection drops (Railway 60s timeout)
      const keepalive = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15_000);

      const startTime = Date.now();
      const brandsData: BrandData[] = [];

      try {
        const totalBrands = brands.length;

        for (let i = 0; i < totalBrands; i++) {
          const brand = brands[i];
          const brandProgress = (i / totalBrands) * 75;

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

          send({
            type: "progress",
            step: `Scraping Facebook ads for ${brand.name}`,
            progress: brandProgress + 15,
            detail: "Querying Facebook Ad Library",
          });

          let ads: Awaited<ReturnType<typeof collectAds>> = [];
          try {
            ads = await collectAds(brand.facebookPage || brand.name, "US", 50);
          } catch {
            ads = [];
          }

          const analytics = computeAdAnalytics(ads);

          send({
            type: "progress",
            step: `Extracting color DNA for ${brand.name}`,
            progress: brandProgress + 30,
            detail: "Analyzing logo and ad creative palettes",
          });

          let colors = null;
          if (logos.primaryLogo) {
            try {
              colors = await extractColors(logos.primaryLogo);
            } catch {
              // Logo color extraction failed
            }
          }

          let adColors = null;
          const topAdImage = ads.find((a) => a.adImageUrl)?.adImageUrl;
          if (topAdImage) {
            try {
              adColors = await extractColors(topAdImage);
            } catch {
              // Ad color extraction failed
            }
          }

          const adCreativeUrls = ads
            .flatMap((a) => a.allImageUrls)
            .filter(Boolean)
            .slice(0, 24);

          send({
            type: "progress",
            step: `Researching ${brand.name} PR, press & activations`,
            progress: brandProgress + 40,
            detail: "Claude web search scanning public brand intelligence",
          });

          let intel;
          try {
            intel = await gatherBrandIntel(brand.name, brand.website);
          } catch {
            intel = { pressReleases: [], pressCoverage: [], activations: [], brandDocuments: [], socialPresence: [], recentCampaigns: [], citations: [] };
          }

          const intelCount = intel.pressReleases.length + intel.pressCoverage.length + intel.activations.length + intel.recentCampaigns.length;

          send({
            type: "progress",
            step: `Scraping social conversations for ${brand.name}`,
            progress: brandProgress + 50,
            detail: "TikTok, Instagram & Reddit organic posts",
          });

          let social: import("@/lib/types").SocialSentiment | null = null;
          try {
            const allPosts = await collectSocialPosts(brand.name);
            const tiktok = allPosts.filter(p => p.platform === "tiktok");
            const instagram = allPosts.filter(p => p.platform === "instagram");
            const reddit = allPosts.filter(p => p.platform === "reddit");

            const computeEng = (p: typeof allPosts[0]) => p.likes + p.comments + p.shares;
            const totalEngagement = allPosts.reduce((s, p) => s + computeEng(p), 0);
            const platformBreakdown = [
              { platform: "tiktok", posts: tiktok.length, engagement: tiktok.reduce((s, p) => s + computeEng(p), 0) },
              { platform: "instagram", posts: instagram.length, engagement: instagram.reduce((s, p) => s + computeEng(p), 0) },
              { platform: "reddit", posts: reddit.length, engagement: reddit.reduce((s, p) => s + computeEng(p), 0) },
            ];
            const topPost = allPosts.length > 0
              ? allPosts.reduce((best, p) => computeEng(p) > computeEng(best) ? p : best)
              : null;

            send({
              type: "progress",
              step: `Analyzing sentiment for ${brand.name}`,
              progress: brandProgress + 55,
              detail: `${allPosts.length} posts collected — Claude analyzing public perception`,
            });

            let sentiment = null;
            try {
              sentiment = await analyzeSentiment(brand.name, allPosts);
            } catch {
              // Sentiment analysis is non-critical
            }

            social = {
              tiktok,
              instagram,
              reddit,
              sentiment,
              summary: {
                totalPosts: allPosts.length,
                totalEngagement,
                platformBreakdown,
                topPost,
              },
            };
          } catch {
            // Social scraping is non-critical
          }

          const socialCount = social?.summary.totalPosts || 0;
          const sentimentLabel = social?.sentiment?.overallLabel || "pending";

          send({
            type: "progress",
            step: `Compiled ${brand.name} intelligence`,
            progress: brandProgress + 60,
            detail: `${ads.length} ads, ${intelCount} press items, ${socialCount} social posts (sentiment: ${sentimentLabel})`,
          });

          brandsData.push({
            name: brand.name,
            website: brand.website,
            logos,
            ads,
            adCreativeUrls,
            colors,
            adColors,
            analytics,
            intel,
            social,
          });
        }

        send({
          type: "progress",
          step: "AIDEN analyzing competitive landscape",
          progress: 80,
          detail: "Phantom brain processing strategic intelligence — this step takes 60-90 seconds",
        });

        const aidenTicker = setInterval(() => {
          send({
            type: "progress",
            step: "AIDEN analyzing competitive landscape",
            progress: 85,
            detail: "Still processing — synthesizing ads, press, and social sentiment data",
          });
        }, 20_000);

        let strategicAnalysis;
        try {
          const aidenInput = brandsData.map((b) => ({
            name: b.name,
            confirmedPageName: b.analytics.confirmedPageName,
            adCount: b.analytics.totalAds,
            primaryColors: b.colors?.primaryColors || [],
            adCreativeColors: b.adColors?.primaryColors || [],
            platformMix: b.analytics.topPlatforms,
            ctaDistribution: b.analytics.topCtas,
            formatMix: {
              videoPercent: b.analytics.videoPercent,
              carouselPercent: b.analytics.carouselPercent,
              imagePercent: b.analytics.imagePercent,
            },
            avgCopyLength: b.analytics.avgCopyLength,
            dateRange: b.analytics.dateRange,
            topAdCopy: b.ads
              .filter((a) => a.adText.length > 50)
              .sort((a, c) => c.adText.length - a.adText.length)
              .slice(0, 5)
              .map((a) => a.adText.slice(0, 500)),
            topHeadlines: b.ads
              .map((a) => a.headline)
              .filter((h): h is string => !!h && h.length > 3)
              .slice(0, 8),
            pressSummary: b.intel.pressCoverage.slice(0, 5).map(p => `${p.source}: ${p.title}`),
            recentActivations: b.intel.activations.slice(0, 3).map(a => a.title),
            recentCampaigns: b.intel.recentCampaigns.slice(0, 3).map(c => `${c.name}: ${c.description}`),
            socialPlatforms: b.intel.socialPresence.map(s => `${s.platform}: ${s.handle}`),
            socialSentiment: b.social ? {
              totalPosts: b.social.summary.totalPosts,
              totalEngagement: b.social.summary.totalEngagement,
              overallScore: b.social.sentiment?.overallScore ?? null,
              overallLabel: b.social.sentiment?.overallLabel ?? "unknown",
              brandPerception: b.social.sentiment?.brandPerception ?? "",
              reputationRisks: b.social.sentiment?.reputationRisks ?? [],
              advocacyDrivers: b.social.sentiment?.advocacyDrivers ?? [],
              positiveThemes: b.social.sentiment?.themes.positive.map(t => `${t.theme}: ${t.example}`) ?? [],
              negativeThemes: b.social.sentiment?.themes.negative.map(t => `${t.theme}: ${t.example}`) ?? [],
              platformBreakdown: b.social.summary.platformBreakdown,
              topTikTokContent: b.social.tiktok.slice(0, 3).map(p => `@${p.author}: ${p.text.slice(0, 100)} (${p.views} views, ${p.likes} likes)`),
              topRedditDiscussions: b.social.reddit.slice(0, 3).map(p => `${p.text.slice(0, 120)} (score: ${p.likes}, ${p.comments} comments)`),
              topInstagramPosts: b.social.instagram.slice(0, 3).map(p => `@${p.author}: ${p.text.slice(0, 100)} (${p.likes} likes)`),
            } : null,
          }));

          const analysisJson = await analyzeWithAiden(aidenInput);
          clearInterval(aidenTicker);
          strategicAnalysis = JSON.parse(analysisJson);
        } catch (e: unknown) {
          clearInterval(aidenTicker);
          console.error("[audit] AIDEN analysis failed:", e instanceof Error ? e.message : e);
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
          id: crypto.randomUUID(),
          brands: brandsData,
          strategicAnalysis,
          duration,
          createdAt: new Date().toISOString(),
        };

        try {
          const { saveReport } = await import("@/lib/supabase/reports");
          const savedId = await saveReport(results, auth.user.id);
          if (!savedId) {
            console.error("[audit] Report save returned null — check Supabase config and RLS policies");
          }
        } catch (saveErr) {
          console.error("[audit] Report save exception:", saveErr instanceof Error ? saveErr.message : saveErr);
        }

        send({ type: "complete", results });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        clearInterval(keepalive);
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
