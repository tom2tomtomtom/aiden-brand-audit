import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectAds,
  FacebookPageConfirmationRequiredError,
} from "@/lib/scrape-creators";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function facebookAd(pageId: string) {
  return {
    ad_archive_id: "ad-1",
    page_name: "Wrong Advertiser",
    snapshot: {
      body: { text: "Wrong ad" },
      title: "Wrong",
      caption: null,
      cta_text: null,
      cta_type: null,
      display_format: "IMAGE",
      link_url: null,
      page_name: "Wrong Advertiser",
      page_id: pageId,
      page_profile_picture_url: "",
      images: [],
      videos: [],
      cards: [],
      extra_images: [],
      extra_videos: [],
    },
  };
}

describe("Facebook advertiser identity containment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("treats a supplied Page ID as authoritative and never retries by name", async () => {
    vi.stubEnv("SCRAPE_CREATORS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [], cursor: null }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(collectAds("Example Dairy", "AU", 50, "123456")).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.searchParams.get("pageId")).toBe("123456");
    expect(requestedUrl.searchParams.has("companyName")).toBe(false);
  });

  it("discards ads whose returned Page ID does not match the authoritative ID", async () => {
    vi.stubEnv("SCRAPE_CREATORS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      results: [facebookAd("999999")],
      cursor: null,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(collectAds("Example Dairy", "AU", 50, "123456")).resolves.toEqual([]);
  });

  it("requires an explicitly confirmed Page ID even when a name search would be exact", async () => {
    vi.stubEnv("SCRAPE_CREATORS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      searchResults: [
        { page_id: "111", name: "Example Dairy", page_alias: "example", category: "Food", likes: 10, image_uri: "" },
      ],
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(collectAds("Example Dairy", "AU")).rejects.toEqual(
      new FacebookPageConfirmationRequiredError("Example Dairy"),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not retry by name when the confirmed Page ID request fails", async () => {
    vi.stubEnv("SCRAPE_CREATORS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("upstream failed", { status: 502 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(collectAds("Example Dairy", "AU", 50, "111")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("pageId=111");
  });
});
