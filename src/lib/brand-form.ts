import type { BrandConfig } from "./types";

export function createInitialBrands(): BrandConfig[] {
  return [{ name: "", website: "" }];
}

export function canRemoveBrand(count: number): boolean {
  return count > 1;
}

export function shouldShowBrandPicker(count: number): boolean {
  return count > 1;
}

export function removeBrandAt(brands: BrandConfig[], index: number): BrandConfig[] {
  if (!canRemoveBrand(brands.length)) return brands;
  return brands.filter((_, brandIndex) => brandIndex !== index);
}

export function formatBrandCount(count: number): string {
  return `${count} ${count === 1 ? "brand" : "brands"}`;
}

export function getFacebookConfirmationError(brands: BrandConfig[]): string | null {
  const unconfirmed = brands.find(
    (brand) => !brand.facebookPage?.trim() || !brand.facebookPageId?.trim(),
  );
  if (!unconfirmed) return null;
  const brandName = unconfirmed.name.trim() || "this brand";
  return `Select and confirm the correct Facebook Page for ${brandName} before starting. If it is not listed, search the exact Meta Page name.`;
}

export function updateBrandField(
  brands: BrandConfig[],
  index: number,
  field: keyof BrandConfig,
  value: string,
): BrandConfig[] {
  return brands.map((brand, brandIndex) => {
    if (brandIndex !== index) return brand;
    const updated: BrandConfig = { ...brand, [field]: value };
    const identityChanged = (field === "name" || field === "website")
      && value !== brand[field];
    if (!identityChanged) return updated;
    delete updated.facebookPage;
    delete updated.facebookPageId;
    return updated;
  });
}

export function updateFacebookPageQuery(
  brands: BrandConfig[],
  index: number,
  value: string,
): BrandConfig[] {
  return brands.map((brand, brandIndex) => {
    if (brandIndex !== index) return brand;
    const updated = { ...brand, facebookPage: value };
    delete updated.facebookPageId;
    return updated;
  });
}
