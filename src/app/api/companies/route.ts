import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/scrape-creators";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_QUERY_LENGTH = 80;

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const query = rawQuery.slice(0, MAX_QUERY_LENGTH).trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const { allowed } = checkRateLimit(`companies:${getClientKey(request)}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many search requests, please slow down.", results: [] },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const data = await searchCompanies(query);
    return NextResponse.json({ results: data.searchResults || [] });
  } catch (error) {
    console.error("[companies] Search failed:", error);
    return NextResponse.json({ results: [] });
  }
}
