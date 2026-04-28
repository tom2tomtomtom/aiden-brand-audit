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
    .select("id, brands, created_at, duration", { count: "exact" })
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
