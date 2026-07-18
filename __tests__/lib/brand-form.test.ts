import { describe, expect, it } from "vitest";
import {
  canRemoveBrand,
  createInitialBrands,
  formatBrandCount,
  getFacebookConfirmationError,
  removeBrandAt,
  shouldShowBrandPicker,
  updateBrandField,
  updateFacebookPageQuery,
} from "@/lib/brand-form";

describe("single-brand form behavior", () => {
  it("starts with exactly one empty brand", () => {
    expect(createInitialBrands()).toEqual([{ name: "", website: "" }]);
  });

  it("only offers removal when more than one brand exists", () => {
    expect(canRemoveBrand(1)).toBe(false);
    expect(canRemoveBrand(2)).toBe(true);
  });

  it("only shows a report brand picker when there is a real choice", () => {
    expect(shouldShowBrandPicker(1)).toBe(false);
    expect(shouldShowBrandPicker(2)).toBe(true);
  });

  it("blocks with a recovery path until every brand has a confirmed Facebook Page", () => {
    expect(getFacebookConfirmationError([
      { name: "Confirmed", website: "confirmed.example", facebookPage: "Confirmed AU", facebookPageId: "123" },
      { name: "Needs Page", website: "missing.example" },
    ])).toBe(
      "Select and confirm the correct Facebook Page for Needs Page before starting. If it is not listed, search the exact Meta Page name.",
    );
    expect(getFacebookConfirmationError([
      { name: "Confirmed", website: "confirmed.example", facebookPage: "Confirmed AU", facebookPageId: "123" },
    ])).toBeNull();
  });

  it("removes down to one brand but never removes the final row", () => {
    const brands = [
      { name: "One", website: "one.example" },
      { name: "Two", website: "two.example" },
    ];

    expect(removeBrandAt(brands, 1)).toEqual([
      { name: "One", website: "one.example" },
    ]);
    expect(removeBrandAt(brands.slice(0, 1), 0)).toEqual(brands.slice(0, 1));
  });

  it("uses the correct singular and plural count label", () => {
    expect(formatBrandCount(1)).toBe("1 brand");
    expect(formatBrandCount(2)).toBe("2 brands");
  });

  it("clears a selected Page ID when the brand name changes", () => {
    const brands = [{
      name: "Old Name",
      website: "example.com",
      facebookPage: "Old Name AU",
      facebookPageId: "123",
    }];

    expect(updateBrandField(brands, 0, "name", "New Name")).toEqual([{
      name: "New Name",
      website: "example.com",
    }]);
  });

  it("clears a selected Page ID when the brand website changes", () => {
    const brands = [{
      name: "Example",
      website: "old.example",
      facebookPage: "Example AU",
      facebookPageId: "123",
    }];

    expect(updateBrandField(brands, 0, "website", "new.example")).toEqual([{
      name: "Example",
      website: "new.example",
    }]);
  });

  it("clears a selected Page ID as soon as its Facebook Page text is edited", () => {
    const brands = [{
      name: "Example",
      website: "example.com",
      facebookPage: "Example AU",
      facebookPageId: "123",
    }];

    expect(updateFacebookPageQuery(brands, 0, "Example NZ")).toEqual([{
      name: "Example",
      website: "example.com",
      facebookPage: "Example NZ",
    }]);
  });
});
