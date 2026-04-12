import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("reports")
    .select("id, brands, created_at, duration")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[reports] List failed:", error.message);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
