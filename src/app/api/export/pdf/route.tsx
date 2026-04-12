import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { BrandDNAReport } from "@/lib/pdf-export";
import type { AuditResults } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const results: AuditResults = await request.json();

    if (!results || !results.brands) {
      return NextResponse.json({ error: "Invalid results data" }, { status: 400 });
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
