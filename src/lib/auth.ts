import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

export type AuthResult =
  | { success: true; user: User }
  | { success: false; response: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return {
      success: false,
      response: NextResponse.json({ error: "Auth not configured" }, { status: 500 }),
    };
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { success: true, user };
}

export async function getUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
