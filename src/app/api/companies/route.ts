import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/scrape-creators";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchCompanies(query);
    return NextResponse.json({ results: data.searchResults || [] });
  } catch (error) {
    console.error("[companies] Search failed:", error);
    return NextResponse.json({ results: [] });
  }
}
