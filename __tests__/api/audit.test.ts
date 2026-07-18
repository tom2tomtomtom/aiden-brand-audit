import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auditMocks = vi.hoisted(() => ({
  analyzeWithAiden: vi.fn(),
  collectAds: vi.fn(),
  deductTokens: vi.fn(),
  saveReport: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

vi.mock("@/lib/apify", () => ({
  collectLogos: vi.fn().mockResolvedValue({
    primaryLogo: null,
    logoVariants: [],
    favicon: null,
    brandName: "Example Dairy",
    brandColors: null,
  }),
}));
vi.mock("@/lib/scrape-creators", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/scrape-creators")>();
  return {
    ...actual,
    collectAds: auditMocks.collectAds,
    computeAdAnalytics: vi.fn().mockReturnValue({
      totalAds: 0,
      platformBreakdown: {},
      ctaBreakdown: {},
      formatBreakdown: {},
      videoPercent: 0,
      carouselPercent: 0,
      imagePercent: 0,
      avgCopyLength: 0,
      dateRange: { earliest: null, latest: null },
      topCtas: [],
      topPlatforms: [],
      confirmedPageName: null,
    }),
  };
});
vi.mock("@/lib/website-identity", () => ({
  countryFromWebsite: vi.fn().mockReturnValue("AU"),
  resolveWebsiteIdentity: vi.fn().mockResolvedValue({
    siteName: null,
    description: null,
    facebookHandle: null,
    facebookPageId: null,
  }),
}));
vi.mock("@/lib/social-scraper", () => ({ collectSocialPosts: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/sentiment-analyzer", () => ({ analyzeSentiment: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/colors", () => ({ extractColors: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/aiden-api", () => ({ analyzeWithAiden: auditMocks.analyzeWithAiden }));
vi.mock("@/lib/normalize", () => ({
  normalizeStrategicAnalysis: vi.fn().mockReturnValue({
    executiveSummary: { overview: "", keyFindings: [], strategicImplications: "" },
    visualDna: { colorStrategies: {}, visualDifferentiation: "", sharedPatterns: [], uniqueElements: {} },
    creativeDna: { messagingThemes: {}, toneAndVoice: {}, creativeDirections: {} },
    strategicSynthesis: { competitivePositioning: {}, whiteSpaceOpportunities: [], recommendedActions: [] },
  }),
}));
vi.mock("@/lib/brand-intel", () => ({
  gatherBrandIntel: vi.fn().mockResolvedValue({
    pressReleases: [],
    pressCoverage: [],
    activations: [],
    brandDocuments: [],
    socialPresence: [],
    recentCampaigns: [],
    citations: [],
  }),
}));
vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ success: true, user: { id: "user-1" } }),
}));
vi.mock("@/lib/gateway-tokens", () => ({
  checkTokens: vi.fn().mockResolvedValue({ balance: 1000 }),
  deductTokens: auditMocks.deductTokens,
  withCostContext: vi.fn((_context, run: () => unknown) => run()),
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockReturnValue({ allowed: true }) }));
vi.mock("@/lib/supabase/reports", () => ({ saveReport: auditMocks.saveReport }));

import { POST } from "@/app/api/audit/route";
import { FacebookPageConfirmationRequiredError } from "@/lib/scrape-creators";

describe("POST /api/audit advertiser confirmation", () => {
  beforeEach(() => {
    vi.stubEnv("AIDEN_SERVICE_KEY", "");
    auditMocks.analyzeWithAiden.mockReset().mockResolvedValue("{}");
    auditMocks.collectAds.mockReset().mockResolvedValue([]);
    auditMocks.deductTokens.mockReset().mockResolvedValue({ success: true });
    auditMocks.saveReport.mockReset().mockResolvedValue("saved");
  });

  it("returns a visible confirmation error instead of completing with an ambiguous advertiser", async () => {
    auditMocks.collectAds.mockRejectedValueOnce(
      new FacebookPageConfirmationRequiredError("Example Dairy"),
    );
    const request = new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brands: [{
          name: "Example Dairy",
          website: "https://example.com.au",
          facebookPage: "Example Dairy AU",
          facebookPageId: "123456",
        }],
      }),
    });

    const response = await POST(request as NextRequest);
    const body = await response.text();

    expect(body).toContain('"type":"error"');
    expect(body).toContain("Select the correct Facebook Page for Example Dairy before retrying.");
    expect(body).not.toContain('"type":"complete"');
  });

  it("rejects an audit before work starts when no Facebook Page was confirmed", async () => {
    const request = new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brands: [{ name: "Example Dairy", website: "https://example.com.au" }],
      }),
    });

    const response = await POST(request as NextRequest);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Confirm the correct Facebook Page for every brand before starting.",
    });
    expect(auditMocks.collectAds).not.toHaveBeenCalled();
  });

  it("cancels for zero charge before finalization commits", async () => {
    vi.stubEnv("AIDEN_SERVICE_KEY", "service-key");
    const analysis = deferred<string>();
    auditMocks.analyzeWithAiden.mockReturnValueOnce(analysis.promise);
    const response = await POST(confirmedAuditRequest());
    const reader = response.body!.getReader();
    await vi.waitFor(() => expect(auditMocks.analyzeWithAiden).toHaveBeenCalledTimes(1));

    await reader.cancel();
    analysis.resolve("{}");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(auditMocks.saveReport).not.toHaveBeenCalled();
    expect(auditMocks.deductTokens).not.toHaveBeenCalled();
  });

  it("finishes all deductions when cancellation arrives during report save", async () => {
    vi.stubEnv("AIDEN_SERVICE_KEY", "service-key");
    const saveStarted = deferred<void>();
    const save = deferred<string>();
    auditMocks.saveReport.mockImplementationOnce(() => {
      saveStarted.resolve();
      return save.promise;
    });
    const response = await POST(confirmedAuditRequest());
    const reader = response.body!.getReader();
    await saveStarted.promise;

    await reader.cancel();
    save.resolve("saved");

    await vi.waitFor(() => expect(auditMocks.deductTokens).toHaveBeenCalledTimes(2));
  });

  it("finishes the deduction sequence when cancellation arrives during billing", async () => {
    vi.stubEnv("AIDEN_SERVICE_KEY", "service-key");
    const firstDeductionStarted = deferred<void>();
    const firstDeduction = deferred<{ success: boolean }>();
    auditMocks.deductTokens
      .mockImplementationOnce(() => {
        firstDeductionStarted.resolve();
        return firstDeduction.promise;
      })
      .mockResolvedValueOnce({ success: true });
    const response = await POST(confirmedAuditRequest());
    const reader = response.body!.getReader();
    await firstDeductionStarted.promise;

    await reader.cancel();
    firstDeduction.resolve({ success: true });

    await vi.waitFor(() => expect(auditMocks.deductTokens).toHaveBeenCalledTimes(2));
  });

  it("does not charge or complete when durable report save returns null", async () => {
    vi.stubEnv("AIDEN_SERVICE_KEY", "service-key");
    auditMocks.saveReport.mockResolvedValueOnce(null);

    const response = await POST(confirmedAuditRequest());
    const body = await response.text();

    expect(auditMocks.deductTokens).not.toHaveBeenCalled();
    expect(body).toContain("The report could not be saved, so no tokens were deducted. Please retry.");
    expect(body).not.toContain('"type":"complete"');
  });

  it("does not charge or complete when durable report save throws", async () => {
    vi.stubEnv("AIDEN_SERVICE_KEY", "service-key");
    auditMocks.saveReport.mockRejectedValueOnce(new Error("database unavailable"));

    const response = await POST(confirmedAuditRequest());
    const body = await response.text();

    expect(auditMocks.deductTokens).not.toHaveBeenCalled();
    expect(body).toContain("The report could not be saved, so no tokens were deducted. Please retry.");
    expect(body).not.toContain('"type":"complete"');
  });
});

function confirmedAuditRequest(): NextRequest {
  return new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brands: [{
        name: "Example Dairy",
        website: "https://example.com.au",
        facebookPage: "Example Dairy AU",
        facebookPageId: "123456",
      }],
    }),
  }) as NextRequest;
}
