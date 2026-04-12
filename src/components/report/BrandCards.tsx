import type { BrandData } from "@/lib/types";
import { getContrastColor } from "@/lib/utils";
import { Globe, Image as ImageIcon, Palette, Video, LayoutGrid } from "lucide-react";

export function BrandCards({ brands }: { brands: BrandData[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-orange-accent uppercase tracking-tight">
        Brands Analyzed
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="bg-black-card border-2 border-border-subtle hover:border-orange-accent transition-all p-6"
          >
            <div className="h-16 flex items-center mb-4">
              {brand.logos.primaryLogo ? (
                <img
                  src={brand.logos.primaryLogo}
                  alt={`${brand.name} logo`}
                  className="h-12 max-w-[120px] object-contain"
                />
              ) : (
                <div className="h-12 w-12 bg-black-deep border border-border-subtle flex items-center justify-center">
                  <span className="text-red-hot font-bold text-lg">
                    {brand.name[0]}
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-white-full uppercase tracking-tight mb-1">
              {brand.name}
            </h3>
            <p className="text-xs text-white-dim font-geist-mono mb-1">{brand.website}</p>
            {brand.analytics.confirmedPageName && (
              <p className="text-[10px] text-orange-accent font-geist-mono mb-4">
                FB: {brand.analytics.confirmedPageName}
              </p>
            )}

            {brand.colors && (
              <div className="flex gap-1 mb-2">
                {[...brand.colors.primaryColors, ...brand.colors.secondaryColors]
                  .slice(0, 6)
                  .map((color, i) => (
                    <div
                      key={i}
                      className="h-6 flex-1 border border-border-subtle relative group"
                      style={{ backgroundColor: color }}
                    >
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[8px] font-geist-mono opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: getContrastColor(color) }}
                      >
                        {color}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {brand.adColors && (
              <div className="mb-4">
                <p className="text-[9px] text-white-dim uppercase tracking-wide mb-1">Ad Creative Colors</p>
                <div className="flex gap-1">
                  {[...brand.adColors.primaryColors, ...brand.adColors.secondaryColors]
                    .slice(0, 6)
                    .map((color, i) => (
                      <div
                        key={i}
                        className="h-4 flex-1 border border-border-subtle"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-5 gap-1 pt-4 border-t border-border-subtle">
              <div className="text-center">
                <Globe className="h-3 w-3 text-white-dim mx-auto mb-1" />
                <p className="text-base font-bold text-red-hot tabular-nums">{brand.analytics.totalAds}</p>
                <p className="text-[9px] text-white-dim uppercase">Ads</p>
              </div>
              <div className="text-center">
                <ImageIcon className="h-3 w-3 text-white-dim mx-auto mb-1" />
                <p className="text-base font-bold text-red-hot tabular-nums">{brand.adCreativeUrls.length}</p>
                <p className="text-[9px] text-white-dim uppercase">Images</p>
              </div>
              <div className="text-center">
                <Video className="h-3 w-3 text-white-dim mx-auto mb-1" />
                <p className="text-base font-bold text-red-hot tabular-nums">{brand.analytics.videoPercent}%</p>
                <p className="text-[9px] text-white-dim uppercase">Video</p>
              </div>
              <div className="text-center">
                <LayoutGrid className="h-3 w-3 text-white-dim mx-auto mb-1" />
                <p className="text-base font-bold text-red-hot tabular-nums">{brand.analytics.carouselPercent}%</p>
                <p className="text-[9px] text-white-dim uppercase">Carousel</p>
              </div>
              <div className="text-center">
                <Palette className="h-3 w-3 text-white-dim mx-auto mb-1" />
                <p className="text-base font-bold text-red-hot tabular-nums">
                  {brand.colors ? brand.colors.primaryColors.length + brand.colors.secondaryColors.length : 0}
                </p>
                <p className="text-[9px] text-white-dim uppercase">Colors</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
