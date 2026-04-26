import { createBrowserClient } from "@supabase/ssr";
import {
  acquireRefreshLock,
  isCircuitOpen,
  nukeAuthStorage,
  recordFailure,
  recordSuccess,
} from "./auth-circuit";

let cached: ReturnType<typeof createBrowserClient> | null = null;

const FATAL_REFRESH_ERRORS = [
  "refresh_token_already_used",
  "refresh_token_not_found",
  "invalid_grant",
];

let redirecting = false;

function isRefreshTokenRequest(url: string, init?: RequestInit): boolean {
  if (!url.includes("/auth/v1/token")) return false;
  if (url.includes("grant_type=refresh_token")) return true;
  const body = init?.body;
  if (typeof body === "string") return body.includes("refresh_token");
  return false;
}

function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.match(/\/\/([^.]+)/)?.[1] ?? "";
}

function gatewayUrl(): string {
  return (
    process.env.NEXT_PUBLIC_GATEWAY_URL ??
    process.env.GATEWAY_URL ??
    "https://www.aiden.services"
  );
}

const hardenedFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const isRefresh = isRefreshTokenRequest(url, init);

  if (isRefresh && isCircuitOpen()) {
    return new Response(
      JSON.stringify({ error: "circuit_open" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let release: (() => void) | null = null;
  if (isRefresh) {
    const lock = await acquireRefreshLock(2000);
    if (!lock) {
      return new Response(
        JSON.stringify({ error: "lock_contended" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }
    release = lock.release;
  }

  try {
    const response = await fetch(input, init);

    if (url.includes("/auth/v1/")) {
      if (response.status === 429) {
        recordFailure();
        if (isRefresh) {
          return new Response(
            JSON.stringify({ error: "rate_limited" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }
      } else if (response.status === 400 && isRefresh) {
        const cloned = response.clone();
        try {
          const text = await cloned.text();
          if (FATAL_REFRESH_ERRORS.some((c) => text.includes(c))) {
            nukeAuthStorage();
            recordFailure();

            if (
              !redirecting &&
              typeof window !== "undefined" &&
              !window.location.pathname.startsWith("/login")
            ) {
              redirecting = true;
              const next = encodeURIComponent(window.location.href);
              window.location.href = `${gatewayUrl()}/login?next=${next}`;
            }

            return new Response(
              JSON.stringify({ error: "invalid_grant" }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }
        } catch {}
      } else if (response.ok && url.includes("/auth/v1/token")) {
        recordSuccess();
        redirecting = false;
      }
    }

    return response;
  } finally {
    if (release) release();
  }
};

export function createClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createBrowserClient(
    url,
    key,
    {
      db: { schema: "brand_audit" },
      auth: {
        flowType: "pkce",
        autoRefreshToken: false,
        persistSession: true,
        storageKey: `sb-${projectRef()}-auth-token`,
      },
      global: { fetch: hardenedFetch },
    },
  );
  return cached;
}
