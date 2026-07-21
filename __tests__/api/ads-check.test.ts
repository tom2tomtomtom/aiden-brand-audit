import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collectAds: vi.fn(),
}));

vi.mock("@/lib/scrape-creators", () => ({
  collectAds: mocks.collectAds,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true }),
}));

import { POST } from "@/app/api/companies/ads-check/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/companies/ads-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/companies/ads-check", () => {
  beforeEach(() => mocks.collectAds.mockReset());

  it("flags only the confirmed brand that has no Meta ads", async () => {
    mocks.collectAds.mockImplementation(async (name: string) =>
      name === "Woolworths" ? [] : [{ adId: "1" }],
    );

    const res = await POST(
      request({
        brands: [
          { name: "Coles", website: "https://coles.com.au", facebookPageId: "175168509213839" },
          { name: "Woolworths", website: "https://woolworths.com.au", facebookPageId: "214878073177" },
        ],
      }),
    );

    expect(await res.json()).toEqual({ noAds: ["Woolworths"] });
  });

  it("skips brands without a confirmed page id and never calls the ad library", async () => {
    const res = await POST(request({ brands: [{ name: "NoPage", website: "https://x.com" }] }));

    expect(await res.json()).toEqual({ noAds: [] });
    expect(mocks.collectAds).not.toHaveBeenCalled();
  });
});
