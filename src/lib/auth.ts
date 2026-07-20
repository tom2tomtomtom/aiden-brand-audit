import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyGatewayJWT, GW_COOKIE_NAME } from "@/lib/gateway-jwt";
import { User } from "@supabase/supabase-js";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://www.aiden.services";
const GW_RT_COOKIE_NAME = "aiden-gw-rt";
const GW_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  domain: process.env.NODE_ENV === "production" ? ".aiden.services" : undefined,
  path: "/",
  sameSite: "lax" as const,
  maxAge: 30 * 60,
};

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

async function recoverUserFromGatewayRT(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(GW_RT_COOKIE_NAME)?.value;
    if (!refreshToken) return null;

    const response = await fetch(`${GATEWAY_URL}/api/auth/access`, {
      method: "POST",
      cache: "no-store",
      headers: { Cookie: `${GW_RT_COOKIE_NAME}=${encodeURIComponent(refreshToken)}` },
    });
    if (!response.ok) return null;

    const data = await response.json() as { jwt?: unknown };
    if (typeof data.jwt !== "string") return null;
    const payload = await verifyGatewayJWT(data.jwt);
    if (!payload) return null;

    cookieStore.set(GW_COOKIE_NAME, data.jwt, GW_COOKIE_OPTIONS);
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

  const recoveredUser = await recoverUserFromGatewayRT();
  if (recoveredUser) return { success: true, user: recoveredUser };

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
