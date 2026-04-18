import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { BrandDNAReport } from "@/lib/pdf-export";
import type { AuditResults } from "@/lib/types";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

// Cap arbitrary client-supplied audit payloads. renderToBuffer is CPU-heavy
// and we don't want an attacker POSTing a 5MB JSON blob to chew up workers.
const MAX_BODY_BYTES = 512 * 1024; // 512KB

export async function POST(request: NextRequest) {
  // Require auth — this endpoint takes arbitrary JSON and burns up to 60s of
  // CPU per call. No business case for anonymous access.
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  // Per-user rate limit. PDF rendering is CPU-bound; 10/min/user is generous
  // for a real human but kills runaway loops and session abuse.
  const { allowed } = checkRateLimit(`export-pdf:${auth.user.id}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many export requests, please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Report payload too large." },
        { status: 413 }
      );
    }

    let results: AuditResults;
    try {
      results = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!results || !Array.isArray(results.brands) || results.brands.length === 0) {
      return NextResponse.json({ error: "Invalid results data" }, { status: 400 });
    }

    // Guard against someone sending 10k brand entries to blow up rendering.
    if (results.brands.length > 20) {
      return NextResponse.json(
        { error: "Too many brands in report (max 20)." },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(<BrandDNAReport results={results} />);

    const brandNames = results.brands.map((b) => b.name.toLowerCase().replace(/\s+/g, "-")).join("-vs-");
    const filename = `brand-dna-${brandNames}-${new Date().toISOString().split("T")[0]}.pdf`;

    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[pdf] Export failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}
