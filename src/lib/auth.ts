import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyGatewayJWT, GW_COOKIE_NAME } from "@/lib/gateway-jwt";
import { User } from "@supabase/supabase-js";

export type AuthResult =
  | { success: true; user: User }
  | { success: false; response: NextResponse };

async function getUserFromGatewayJWT(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const gwToken = cookieStore.get(GW_COOKIE_NAME)?.value;
    if (!gwToken) return null;
    const payload = await verifyGatewayJWT(gwToken);
    if (!payload) return null;
    return { id: payload.sub, email: payload.email } as unknown as User;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { success: true, user };
  }

  const gwUser = await getUserFromGatewayJWT();
  if (gwUser) return { success: true, user: gwUser };

  return {
    success: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}

export async function getUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
  }

  return getUserFromGatewayJWT();
}
