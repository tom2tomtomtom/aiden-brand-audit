import { NextRequest, NextResponse } from "next/server";
import { collectAds } from "@/lib/scrape-creators";
import { countryFromWebsite } from "@/lib/website-identity";
import { checkRateLimit } from "@/lib/rate-limit";

// Pre-audit check: which selected brands have no ads in the Meta Ad Library.
// A brand with zero ads is still billed the full per-brand cost, so the
// dashboard warns before the (paid) audit starts. Read-only, no token spend.
// Mirrors the audit's own ad collection (page-id + geo-scoped) so the warning
// matches what the audit would actually find.

interface BrandCheck {
  name?: string;
  website?: string;
  facebookPageId?: string;
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(`ads-check:${getClientKey(request)}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests, please slow down.", noAds: [] },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: { brands?: BrandCheck[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ noAds: [] });
  }

  const brands = (body.brands || [])
    .filter((b): b is BrandCheck & { name: string; facebookPageId: string } =>
      Boolean(b.name?.trim()) && Boolean(b.facebookPageId?.trim()))
    .slice(0, 5);

  const results = await Promise.all(
    brands.map(async (b) => {
      try {
        const country = b.website ? countryFromWebsite(b.website) ?? "ALL" : "ALL";
        const ads = await collectAds(b.name, country, 1, b.facebookPageId);
        return { name: b.name, hasAds: ads.length > 0 };
      } catch {
        // Ambiguous (e.g. transient upstream error): never warn on uncertainty.
        return { name: b.name, hasAds: true };
      }
    }),
  );

  const noAds = results.filter((r) => !r.hasAds).map((r) => r.name);
  return NextResponse.json({ noAds });
}
