"use client";

import { useState } from "react";
import type { BrandData, BrandAd } from "@/lib/types";
import { ExternalLink, Filter, Video, LayoutGrid, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

function CarouselViewer({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);
  if (images.length <= 1) return null;

  return (
    <div className="relative">
      <img
        src={images[current]}
        alt={`Carousel image ${current + 1}`}
        className="w-full aspect-video object-cover"
        loading="lazy"
      />
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          className="p-1 bg-black-ink/80 text-white-full hover:bg-red-hot transition-colors"
          disabled={current === 0}
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span className="text-[10px] text-white-full bg-black-ink/80 px-2 py-0.5 font-geist-mono tabular-nums">
          {current + 1}/{images.length}
        </span>
        <button
          onClick={() => setCurrent(Math.min(images.length - 1, current + 1))}
          className="p-1 bg-black-ink/80 text-white-full hover:bg-red-hot transition-colors"
          disabled={current === images.length - 1}
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function AdCard({ ad, brandName }: { ad: BrandAd; brandName: string }) {
  const hasMultipleImages = ad.allImageUrls.length > 1;

  return (
    <div className="bg-black-card border-2 border-border-subtle hover:border-orange-accent hover:bg-black-deep transition-all group">
      {/* Media section */}
      {hasMultipleImages ? (
        <CarouselViewer images={ad.allImageUrls} />
      ) : ad.adImageUrl ? (
        <div className="aspect-video bg-black-deep overflow-hidden relative">
          <img
            src={ad.adImageUrl}
            alt={`${brandName} ad`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
          {ad.isVideo && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black-ink/80 px-2 py-0.5">
              <Video className="h-3 w-3 text-orange-accent" />
              <span className="text-[10px] text-orange-accent uppercase font-bold">Video</span>
            </div>
          )}
          {ad.isCarousel && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black-ink/80 px-2 py-0.5">
              <LayoutGrid className="h-3 w-3 text-yellow-electric" />
              <span className="text-[10px] text-yellow-electric uppercase font-bold">Carousel</span>
            </div>
          )}
        </div>
      ) : ad.isVideo && ad.adVideoUrl ? (
        <div className="aspect-video bg-black-deep flex items-center justify-center border-b border-border-subtle">
          <a href={ad.adVideoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-orange-accent hover:text-red-hot transition-colors">
            <Video className="h-6 w-6" />
            <span className="text-xs uppercase font-bold">Watch Video</span>
          </a>
        </div>
      ) : null}

      <div className="p-4">
        {/* Headline */}
        {ad.headline && (
          <p className="text-sm font-bold text-white-full mb-1 line-clamp-2">{ad.headline}</p>
        )}

        {/* Ad copy */}
        <p className="text-xs text-white-muted line-clamp-3 mb-3">
          {ad.adText || "No ad text available"}
        </p>

        {/* Metadata */}
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
          {ad.displayFormat && ad.displayFormat !== "UNKNOWN" && (
            <span className="px-2 py-0.5 bg-orange-accent/10 border border-orange-accent/30 text-[10px] text-orange-accent uppercase tracking-wide">
              {ad.displayFormat.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Date + Page + Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-white-dim">
            {ad.pageName && ad.pageName !== "Unknown" && (
              <span className="truncate max-w-[100px]">{ad.pageName}</span>
            )}
            {ad.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(ad.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
              </span>
            )}
          </div>
          {ad.adUrl && (
            <a
              href={ad.adUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-orange-accent hover:text-red-hot transition-colors uppercase tracking-wide"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdGallery({ brands }: { brands: BrandData[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "video" | "carousel" | "image">("all");

  const filteredBrands = selectedBrand === "all"
    ? brands
    : brands.filter((b) => b.name === selectedBrand);

  function filterAds(ads: BrandAd[]) {
    if (filterType === "all") return ads;
    if (filterType === "video") return ads.filter(a => a.isVideo);
    if (filterType === "carousel") return ads.filter(a => a.isCarousel);
    return ads.filter(a => !a.isVideo && !a.isCarousel);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Ad Intelligence
        </h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {(["all", "image", "video", "carousel"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-wide font-bold border transition-colors ${
                  filterType === type
                    ? "bg-red-hot border-red-hot text-white"
                    : "bg-black-card border-border-subtle text-white-dim hover:border-border-strong"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

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
      </div>

      {filteredBrands.map((brand) => {
        const ads = filterAds(brand.ads);
        return (
          <div key={brand.name} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-orange-accent uppercase tracking-tight">
                {brand.name}
              </h3>
              <span className="text-xs text-white-dim font-geist-mono tabular-nums">
                {ads.length} ads {filterType !== "all" ? `(${filterType})` : ""}
              </span>
            </div>

            {ads.length === 0 ? (
              <p className="text-xs text-white-dim p-8 text-center bg-black-card border border-border-subtle">
                No {filterType} ads found for {brand.name}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.slice(0, 24).map((ad) => (
                  <AdCard key={ad.adId} ad={ad} brandName={brand.name} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
