import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/usage";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.success) return auth.response;

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const planLimits = await getPlanLimits(supabase, auth.user.id);
  return NextResponse.json(planLimits);
}
