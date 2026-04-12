"use client";

import { useState } from "react";
import type { BrandData } from "@/lib/types";
import { ExternalLink, Filter } from "lucide-react";

export function AdGallery({ brands }: { brands: BrandData[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const filteredBrands = selectedBrand === "all"
    ? brands
    : brands.filter((b) => b.name === selectedBrand);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Ad Intelligence
        </h2>

        {/* Brand filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white-dim" />
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-black-card border border-border-subtle text-white-full px-3 py-1.5 text-xs uppercase tracking-wide"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredBrands.map((brand) => (
        <div key={brand.name} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-orange-accent uppercase tracking-tight">
              {brand.name}
            </h3>
            <span className="text-xs text-white-dim font-geist-mono tabular-nums">
              {brand.ads.length} ads
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brand.ads.slice(0, 18).map((ad) => (
              <div
                key={ad.adId}
                className="bg-black-card border-2 border-border-subtle hover:border-orange-accent hover:bg-black-deep transition-all group"
              >
                {ad.adImageUrl && (
                  <div className="aspect-video bg-black-deep overflow-hidden">
                    <img
                      src={ad.adImageUrl}
                      alt={`${brand.name} ad`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="p-4">
                  <p className="text-sm text-white-muted line-clamp-3 mb-3">
                    {ad.adText || "No ad text available"}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ad.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-0.5 bg-black-deep border border-border-subtle text-[10px] text-white-dim uppercase tracking-wide"
                      >
                        {platform}
                      </span>
                    ))}
                    {ad.cta && (
                      <span className="px-2 py-0.5 bg-red-hot/10 border border-red-hot/30 text-[10px] text-red-hot uppercase tracking-wide font-bold">
                        {ad.cta}
                      </span>
                    )}
                  </div>

                  {ad.adUrl && (
                    <a
                      href={ad.adUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-orange-accent hover:text-red-hot transition-colors uppercase tracking-wide"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View in Ad Library
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
