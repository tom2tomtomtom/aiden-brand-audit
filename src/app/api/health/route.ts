import { getAidenHealth } from "@/lib/aiden-api";

export async function GET() {
  const aidenConnected = await getAidenHealth();
  const apifyConfigured = !!process.env.APIFY_API_KEY;

  return Response.json({
    status: "healthy",
    aidenConnected,
    apifyConfigured,
    timestamp: new Date().toISOString(),
  });
}
