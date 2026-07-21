import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadReportShare: vi.fn(),
  requireAuth: vi.fn(),
  // Captures the last update() payload + eq() filters the PATCH handler applied.
  service: { table: undefined as string | undefined, payload: undefined as unknown, filters: [] as Array<[string, unknown]> },
  serviceResult: { error: null as unknown },
}));

// Keep the real isShareActive (pure) while stubbing the DB load.
vi.mock("@/lib/supabase/reports", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/supabase/reports")>();
  return { ...actual, loadReportShare: mocks.loadReportShare };
});

vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => {
    mocks.service.payload = undefined;
    mocks.service.filters = [];
    const builder: Record<string, unknown> = {};
    builder.update = (payload: unknown) => { mocks.service.payload = payload; return builder; };
    builder.eq = (col: string, val: unknown) => { mocks.service.filters.push([col, val]); return builder; };
    builder.then = (resolve: (v: unknown) => unknown) => resolve(mocks.serviceResult);
    return { from: (table: string) => { mocks.service.table = table; return builder; } };
  },
}));

import { GET } from "@/app/api/reports/[id]/route";
import { PATCH } from "@/app/api/reports/route";
import { isShareActive } from "@/lib/supabase/reports";

function getRequest(): NextRequest {
  return new Request("http://localhost/api/reports/x") as unknown as NextRequest;
}

function patchRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/reports", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const REPORT = { brands: [], strategicAnalysis: {} } as unknown;

describe("isShareActive", () => {
  it("is active when neither revoked nor expiring", () => {
    expect(isShareActive({ revokedAt: null, shareExpiresAt: null })).toBe(true);
  });

  it("is not viewable once revoked", () => {
    expect(isShareActive({ revokedAt: "2026-07-21T00:00:00.000Z", shareExpiresAt: null })).toBe(false);
  });

  it("is not viewable once the expiry has passed", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isShareActive({ revokedAt: null, shareExpiresAt: past })).toBe(false);
  });

  it("is viewable while the expiry is still in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isShareActive({ revokedAt: null, shareExpiresAt: future })).toBe(true);
  });

  it("is viewable again once un-revoked (revokedAt cleared)", () => {
    expect(isShareActive({ revokedAt: null, shareExpiresAt: null })).toBe(true);
  });
});

describe("GET /api/reports/[id] share enforcement", () => {
  beforeEach(() => mocks.loadReportShare.mockReset());

  it("returns 404 for an unknown id", async () => {
    mocks.loadReportShare.mockResolvedValueOnce(null);
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 with the report body for an active link", async () => {
    mocks.loadReportShare.mockResolvedValueOnce({ results: REPORT, revokedAt: null, shareExpiresAt: null });
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(REPORT);
  });

  it("returns 410 (not the report) for a revoked link", async () => {
    mocks.loadReportShare.mockResolvedValueOnce({
      results: REPORT,
      revokedAt: "2026-07-21T00:00:00.000Z",
      shareExpiresAt: null,
    });
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(410);
    expect(await res.json()).not.toHaveProperty("brands");
  });

  it("returns 410 for an expired link", async () => {
    mocks.loadReportShare.mockResolvedValueOnce({
      results: REPORT,
      revokedAt: null,
      shareExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(410);
  });

  it("serves the report again after the expiry is pushed into the future", async () => {
    mocks.loadReportShare.mockResolvedValueOnce({
      results: REPORT,
      revokedAt: null,
      shareExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const res = await GET(getRequest(), { params: Promise.resolve({ id: "r1" }) });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/reports share management", () => {
  beforeEach(() => {
    mocks.requireAuth.mockReset().mockResolvedValue({ success: true, user: { id: "user-1" } });
    mocks.serviceResult.error = null;
    mocks.service.payload = undefined;
    mocks.service.filters = [];
  });

  it("rejects an unauthenticated caller", async () => {
    mocks.requireAuth.mockResolvedValueOnce({
      success: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const res = await PATCH(patchRequest({ id: "r1", action: "revoke" }));
    expect(res.status).toBe(401);
  });

  it("requires a report id", async () => {
    const res = await PATCH(patchRequest({ action: "revoke" }));
    expect(res.status).toBe(400);
  });

  it("revokes a report scoped to the owner (sets revoked_at, filters by user_id)", async () => {
    const res = await PATCH(patchRequest({ id: "r1", action: "revoke" }));
    expect(res.status).toBe(200);
    const payload = mocks.service.payload as { revoked_at?: string };
    expect(typeof payload.revoked_at).toBe("string");
    expect(mocks.service.filters).toContainEqual(["id", "r1"]);
    expect(mocks.service.filters).toContainEqual(["user_id", "user-1"]);
  });

  it("un-revokes by clearing revoked_at", async () => {
    const res = await PATCH(patchRequest({ id: "r1", action: "unrevoke" }));
    expect(res.status).toBe(200);
    expect(mocks.service.payload).toEqual({ revoked_at: null });
  });

  it("rejects an unknown action", async () => {
    const res = await PATCH(patchRequest({ id: "r1", action: "nope" }));
    expect(res.status).toBe(400);
  });

  it("sets an expiry from expiresAt and clears it with null", async () => {
    const future = "2026-12-31T00:00:00.000Z";
    const set = await PATCH(patchRequest({ id: "r1", expiresAt: future }));
    expect(set.status).toBe(200);
    expect(mocks.service.payload).toEqual({ share_expires_at: future });

    const clear = await PATCH(patchRequest({ id: "r1", expiresAt: null }));
    expect(clear.status).toBe(200);
    expect(mocks.service.payload).toEqual({ share_expires_at: null });
  });

  it("rejects an invalid expiresAt", async () => {
    const res = await PATCH(patchRequest({ id: "r1", expiresAt: "not-a-date" }));
    expect(res.status).toBe(400);
  });
});
