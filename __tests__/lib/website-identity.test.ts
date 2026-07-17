import { describe, it, expect } from "vitest";
import { countryFromWebsite } from "@/lib/website-identity";

/**
 * UXA-20260717 F-028: the Meta Ad Library search must be geo-scoped to the
 * brand's own country so a same-name overseas advertiser can't be pulled
 * (an AU dairy brand matched an overseas clothing label). This helper
 * derives the country from the website ccTLD.
 */
describe("countryFromWebsite (F-028 geo-scoping)", () => {
  it("maps second-level ccTLDs to ISO country codes", () => {
    expect(countryFromWebsite("https://www.dairybrand.com.au")).toBe("AU");
    expect(countryFromWebsite("thebrand.co.uk")).toBe("GB");
    expect(countryFromWebsite("https://brand.co.nz/path")).toBe("NZ");
  });

  it("maps bare ccTLDs", () => {
    expect(countryFromWebsite("https://brand.de")).toBe("DE");
    expect(countryFromWebsite("brand.ie")).toBe("IE");
  });

  it("returns undefined for generic gTLDs so the caller keeps ALL", () => {
    expect(countryFromWebsite("https://brand.com")).toBeUndefined();
    expect(countryFromWebsite("brand.io")).toBeUndefined();
    expect(countryFromWebsite("brand.org")).toBeUndefined();
  });

  it("handles empty / malformed input without throwing", () => {
    expect(countryFromWebsite("")).toBeUndefined();
    expect(countryFromWebsite("not a url")).toBeUndefined();
  });
});
