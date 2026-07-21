import { describe, expect, it } from "vitest";
import { describeSources } from "@/components/report/SocialSentiment";

// The Social Pulse header must name the sources actually captured, not a fixed
// "TikTok, Instagram & Reddit" string. A dataset that is all TikTok should read
// "from TikTok".
describe("describeSources", () => {
  it("names a single captured source", () => {
    const posts = Array.from({ length: 16 }, () => ({ platform: "tiktok" }));
    expect(describeSources(posts)).toBe("TikTok");
  });

  it("joins two sources with an ampersand", () => {
    expect(describeSources([{ platform: "tiktok" }, { platform: "reddit" }])).toBe(
      "TikTok & Reddit",
    );
  });

  it("orders three sources canonically with a serial ampersand", () => {
    const posts = [{ platform: "reddit" }, { platform: "instagram" }, { platform: "tiktok" }];
    expect(describeSources(posts)).toBe("TikTok, Instagram & Reddit");
  });

  it("falls back to a neutral label when there are no posts", () => {
    expect(describeSources([])).toBe("social media");
  });
});
