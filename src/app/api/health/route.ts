import { getAidenHealth } from "@/lib/aiden-api";

export async function GET() {
  const aidenConnected = await getAidenHealth();
  const scrapeCreatorsConfigured = !!process.env.SCRAPE_CREATORS_API_KEY;
  const apifyConfigured = !!process.env.APIFY_API_KEY;
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

  return Response.json({
    status: "healthy",
    aidenConnected,
    scrapeCreatorsConfigured,
    apifyConfigured,
    anthropicConfigured,
    timestamp: new Date().toISOString(),
  });
}
