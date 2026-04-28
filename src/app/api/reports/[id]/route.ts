import { NextRequest, NextResponse } from "next/server";
import { loadReport } from "@/lib/supabase/reports";

/**
 * GET /api/reports/[id]
 *
 * ACCESS MODEL: Secret link. Anyone with the UUID can view the full report.
 * Report IDs are cryptographically random (crypto.randomUUID, see
 * app/api/audit/route.ts) and are NOT enumerable. This endpoint is the backing
 * for the /report/[id] "SharedReportPage". Same model as Google Docs
 * "anyone with the link" sharing.
 *
 * If owner-only access is ever required, add requireAuth() here and compare
 * auth.user.id against the report's user_id column (already persisted by
 * saveReport). DO NOT log report IDs to any external surface.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const report = await loadReport(id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
