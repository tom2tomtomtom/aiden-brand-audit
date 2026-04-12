"use client";

import { useState } from "react";
import type { BrandData } from "@/lib/types";
import { BarChart3, PieChart, FileText, Calendar, MessageSquare } from "lucide-react";

function BarStat({ label, value, maxValue, color = "bg-red-hot" }: {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white-dim uppercase tracking-wide w-28 text-right flex-shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-6 bg-black-deep border border-border-subtle relative">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${width}%` }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-geist-mono text-white-full tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

function FormatDonut({ imagePercent, videoPercent, carouselPercent }: {
  imagePercent: number;
  videoPercent: number;
  carouselPercent: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="grid grid-cols-3 gap-4 flex-1">
        <div className="text-center p-4 bg-black-deep border border-border-subtle">
          <p className="text-2xl font-bold text-red-hot tabular-nums">{imagePercent}%</p>
          <p className="text-[10px] text-white-dim uppercase tracking-wide mt-1">Image</p>
        </div>
        <div className="text-center p-4 bg-black-deep border border-border-subtle">
          <p className="text-2xl font-bold text-orange-accent tabular-nums">{videoPercent}%</p>
          <p className="text-[10px] text-white-dim uppercase tracking-wide mt-1">Video</p>
        </div>
        <div className="text-center p-4 bg-black-deep border border-border-subtle">
          <p className="text-2xl font-bold text-yellow-electric tabular-nums">{carouselPercent}%</p>
          <p className="text-[10px] text-white-dim uppercase tracking-wide mt-1">Carousel</p>
        </div>
      </div>
    </div>
  );
}

export function AdAnalytics({ brands }: { brands: BrandData[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const filteredBrands = selectedBrand === "all"
    ? brands
    : brands.filter((b) => b.name === selectedBrand);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Ad Analytics
        </h2>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-white-dim" />
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

      {filteredBrands.map((brand) => {
        const a = brand.analytics;
        const maxPlatformCount = Math.max(...a.topPlatforms.map(p => p.count), 1);
        const maxCtaCount = Math.max(...a.topCtas.map(c => c.count), 1);

        return (
          <div key={brand.name} className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-red-hot">
              <h3 className="text-lg font-bold text-orange-accent uppercase tracking-tight">
                {brand.name}
              </h3>
              <span className="text-xs text-white-dim font-geist-mono tabular-nums">
                {a.totalAds} active ads
              </span>
              {a.confirmedPageName && (
                <span className="text-[10px] text-white-dim">
                  via {a.confirmedPageName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Breakdown */}
              <div className="bg-black-deep border-2 border-border-subtle p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="h-4 w-4 text-orange-accent" />
                  <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
                    Platform Distribution
                  </h4>
                </div>
                <div className="space-y-2">
                  {a.topPlatforms.map((p) => (
                    <BarStat key={p.platform} label={p.platform} value={p.count} maxValue={maxPlatformCount} />
                  ))}
                  {a.topPlatforms.length === 0 && (
                    <p className="text-xs text-white-dim">No platform data</p>
                  )}
                </div>
              </div>

              {/* CTA Distribution */}
              <div className="bg-black-deep border-2 border-border-subtle p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-orange-accent" />
                  <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
                    CTA Distribution
                  </h4>
                </div>
                <div className="space-y-2">
                  {a.topCtas.map((c) => (
                    <BarStat key={c.cta} label={c.cta} value={c.count} maxValue={maxCtaCount} color="bg-orange-accent" />
                  ))}
                  {a.topCtas.length === 0 && (
                    <p className="text-xs text-white-dim">No CTA data detected</p>
                  )}
                </div>
              </div>

              {/* Format Mix */}
              <div className="bg-black-deep border-2 border-border-subtle p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-orange-accent" />
                  <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
                    Ad Format Mix
                  </h4>
                </div>
                <FormatDonut
                  imagePercent={a.imagePercent}
                  videoPercent={a.videoPercent}
                  carouselPercent={a.carouselPercent}
                />
              </div>

              {/* Copy Analysis + Date Range */}
              <div className="bg-black-deep border-2 border-border-subtle p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-orange-accent" />
                  <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
                    Copy &amp; Timing
                  </h4>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black-card border border-border-subtle">
                      <p className="text-[10px] text-white-dim uppercase tracking-wide mb-1">
                        Avg Copy Length
                      </p>
                      <p className="text-xl font-bold text-red-hot tabular-nums font-geist-mono">
                        {a.avgCopyLength}
                      </p>
                      <p className="text-[10px] text-white-dim">characters</p>
                    </div>
                    <div className="p-3 bg-black-card border border-border-subtle">
                      <p className="text-[10px] text-white-dim uppercase tracking-wide mb-1">
                        Active Since
                      </p>
                      <p className="text-sm font-bold text-red-hot font-geist-mono">
                        {a.dateRange.earliest
                          ? new Date(a.dateRange.earliest).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                          : "N/A"}
                      </p>
                      <p className="text-[10px] text-white-dim">
                        {a.dateRange.latest
                          ? `to ${new Date(a.dateRange.latest).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Top headlines */}
                  {brand.ads.some(ad => ad.headline) && (
                    <div>
                      <p className="text-[10px] text-white-dim uppercase tracking-wide mb-2">
                        Top Headlines
                      </p>
                      <div className="space-y-1">
                        {brand.ads
                          .map(ad => ad.headline)
                          .filter((h): h is string => !!h && h.length > 3)
                          .slice(0, 5)
                          .map((headline, i) => (
                            <p key={i} className="text-xs text-white-muted truncate">
                              <span className="text-orange-accent mr-2">{i + 1}.</span>
                              {headline}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
