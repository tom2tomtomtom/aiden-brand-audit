import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyGatewayJWT, GW_COOKIE_NAME } from "@/lib/gateway-jwt";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://www.aiden.services';
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.aiden.services' : undefined;

function getPublicUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}${request.nextUrl.pathname}${request.nextUrl.search}`;
  }
  return request.nextUrl.href;
}

const GW_RT_COOKIE_NAME = 'aiden-gw-rt';
const RT_MAX_AGE = 30 * 24 * 60 * 60;

async function refreshFromGatewayRT(
  request: NextRequest
): Promise<NextResponse | null> {
  const rt = request.cookies.get(GW_RT_COOKIE_NAME)?.value;
  if (!rt) return null;
  try {
    const res = await fetch(`${GATEWAY_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `${GW_RT_COOKIE_NAME}=${rt}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.jwt || !data.refreshToken) return null;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-auth-verified', '1');
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    response.cookies.set(GW_COOKIE_NAME, data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: COOKIE_DOMAIN,
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 60,
    });
    response.cookies.set(GW_RT_COOKIE_NAME, data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      domain: COOKIE_DOMAIN,
      path: '/',
      sameSite: 'lax',
      maxAge: RT_MAX_AGE,
    });

    return response;
  } catch {
    return null;
  }
}

async function refreshFromGateway(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    // Forward every cookie (sb-* Supabase session AND aiden-gw Gateway JWT).
    // Filtering to sb-* only breaks refresh for users whose aiden-gw is
    // present but near expiry (sister of the Brief Sharpener fix).
    const cookieHeader = request.cookies
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    if (!cookieHeader) return null;

    const res = await fetch(`${GATEWAY_URL}/api/auth/session`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-middleware-auth-verified', '1');
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    if (data.jwt) {
      response.cookies.set(GW_COOKIE_NAME, data.jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: COOKIE_DOMAIN,
        path: '/',
        sameSite: 'lax',
        maxAge: 30 * 60,
      });
    }

    if (data.cookies) {
      for (const { name, value, options } of data.cookies) {
        response.cookies.set(name, value, {
          ...options,
          domain: COOKIE_DOMAIN,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    }

    return response;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // BUG-BA-011 redirect REMOVED 2026-04-28. Two reasons:
  // 1. Conflict: project CLAUDE.md says canonical IS brandaudit (no hyphen);
  //    Tom's 2026-04-28 launch decision said brand-audit (with hyphen). Needs reconciliation.
  // 2. The previous code leaked Railway's internal port 8080 in the redirect target,
  //    AND brand-audit.aiden.services DNS does not exist yet. Restoring production.
  // Re-enable only after: (a) canonical decision confirmed, (b) DNS CNAME live, (c) port stripped.

  let response = NextResponse.next({ request });

  const protectedPaths = ["/dashboard", "/account"];
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));
  const authPaths = ["/login", "/register"];
  const isAuthPage = authPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!isProtected && !isAuthPage) return response;

  // Tier 1: Check Gateway JWT (fast, local verify)
  const gwToken = request.cookies.get(GW_COOKIE_NAME)?.value;
  if (gwToken) {
    const payload = await verifyGatewayJWT(gwToken);
    if (payload) {
      if (isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-middleware-auth-verified', '1');
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  // Tier 2a: Refresh via Gateway refresh token (no Supabase dependency)
  const rtResult = await refreshFromGatewayRT(request);
  if (rtResult) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return rtResult;
  }

  // Tier 2b: Refresh from Gateway via Supabase cookies (legacy fallback)
  const refreshResult = await refreshFromGateway(request);
  if (refreshResult) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return refreshResult;
  }

  // Tier 3: Fall back to Supabase session
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, domain: COOKIE_DOMAIN }),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const publicUrl = getPublicUrl(request);
    return NextResponse.redirect(`${GATEWAY_URL}/login?next=${encodeURIComponent(publicUrl)}`);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
