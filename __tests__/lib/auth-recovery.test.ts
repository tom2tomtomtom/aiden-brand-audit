import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  createServerSupabase: vi.fn(),
  verifyGatewayJWT: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: mocks.createServerSupabase,
}));

vi.mock("@/lib/gateway-jwt", () => ({
  GW_COOKIE_NAME: "aiden-gw",
  verifyGatewayJWT: mocks.verifyGatewayJWT,
}));

import { requireAuth } from "@/lib/auth";

describe("Gateway RT-only API recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabase.mockResolvedValue(null);
    mocks.cookieGet.mockImplementation((name: string) =>
      name === "aiden-gw-rt" ? { value: "durable-refresh-token" } : undefined,
    );
    global.fetch = vi.fn();
  });

  it("mints and verifies a short-lived access token without rotating the durable token", async () => {
    mocks.verifyGatewayJWT.mockResolvedValue({
      sub: "user-123",
      email: "person@example.com",
      iss: "aiden-gateway",
    });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      jwt: "fresh-access-token",
      user: { id: "user-123", email: "person@example.com" },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    await expect(requireAuth()).resolves.toMatchObject({
      success: true,
      user: { id: "user-123", email: "person@example.com" },
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://www.aiden.services/api/auth/access",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: { Cookie: "aiden-gw-rt=durable-refresh-token" },
      }),
    );
    expect(mocks.verifyGatewayJWT).toHaveBeenCalledWith("fresh-access-token");
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "aiden-gw",
      "fresh-access-token",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 30 * 60,
      }),
    );
    expect(mocks.cookieSet).not.toHaveBeenCalledWith(
      "aiden-gw-rt",
      expect.anything(),
      expect.anything(),
    );
  });

  it("fails closed when Gateway rejects the durable token", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    ));

    const result = await requireAuth();

    expect(result.success).toBe(false);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("fails closed when the minted access token cannot be verified locally", async () => {
    mocks.verifyGatewayJWT.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      jwt: "untrusted-access-token",
      user: { id: "attacker", email: "attacker@example.com" },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    const result = await requireAuth();

    expect(result.success).toBe(false);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it("uses passive access minting in middleware without rotating the durable token", () => {
    const source = readFileSync(resolve(process.cwd(), "middleware.ts"), "utf8");

    expect(source).toContain("/api/auth/access");
    expect(source).not.toContain("/api/auth/refresh");
    expect(source).not.toContain("data.refreshToken");
    expect(source).not.toMatch(/response\.cookies\.set\(GW_RT_COOKIE_NAME/);
    expect(source).toContain("name !== GW_COOKIE_NAME");
    expect(source).toContain("`${GW_COOKIE_NAME}=${data.jwt}`");
  });
});
