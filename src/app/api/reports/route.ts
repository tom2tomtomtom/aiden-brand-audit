import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("reports")
    .select("id, brands, created_at, duration, revoked_at, share_expires_at", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[reports] List failed:", error.message);
    return NextResponse.json({ reports: [], total: 0 });
  }

  return NextResponse.json({ reports: data ?? [], total: count ?? 0 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("[reports] Delete failed:", error.message);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/reports
 *
 * Owner-scoped share-link management. Revoke (or un-revoke) a report's public
 * share link, and optionally set/clear an expiry. Scoped to the caller exactly
 * like DELETE (.eq user_id), so a report can only be changed by its owner.
 *
 * Body: { id: string, action?: "revoke" | "unrevoke", expiresAt?: string | null }
 *   - action "revoke"   -> revoked_at = now()
 *   - action "unrevoke" -> revoked_at = null
 *   - expiresAt string  -> share_expires_at = that timestamp (ISO)
 *   - expiresAt null    -> share_expires_at cleared
 * Enforced on the public GET route (src/app/api/reports/[id]/route.ts).
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const update: { revoked_at?: string | null; share_expires_at?: string | null } = {};

  if (body.action === "revoke") {
    update.revoked_at = new Date().toISOString();
  } else if (body.action === "unrevoke") {
    update.revoked_at = null;
  } else if (body.action !== undefined) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if ("expiresAt" in body) {
    const value = body.expiresAt;
    if (value === null) {
      update.share_expires_at = null;
    } else if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
      update.share_expires_at = new Date(value).toISOString();
    } else {
      return NextResponse.json({ error: "Invalid expiresAt" }, { status: 400 });
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error } = await supabase
    .from("reports")
    .update(update)
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("[reports] Share update failed:", error.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
