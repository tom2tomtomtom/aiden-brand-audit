"use client";

import { useState } from "react";
import type { BrandData } from "@/lib/types";
import { Newspaper, Megaphone, FileText, Globe, Rocket, ExternalLink, Quote } from "lucide-react";

function IntelCard({ title, icon: Icon, children, count }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  count: number;
}) {
  if (count === 0) return null;
  return (
    <div className="bg-black-deep border-2 border-border-subtle p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-orange-accent" />
        <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
          {title}
        </h4>
        <span className="text-[10px] text-white-dim font-geist-mono tabular-nums ml-auto">
          {count} found
        </span>
      </div>
      {children}
    </div>
  );
}

function LinkItem({ title, source, url, date, summary }: {
  title: string;
  source?: string;
  url: string;
  date?: string;
  summary?: string;
}) {
  return (
    <div className="py-3 border-b border-border-subtle last:border-0">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2"
      >
        <ExternalLink className="h-3 w-3 text-orange-accent mt-1 flex-shrink-0 group-hover:text-red-hot transition-colors" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white-full group-hover:text-red-hot transition-colors line-clamp-2">
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {source && <span className="text-[10px] text-orange-accent uppercase tracking-wide">{source}</span>}
            {date && <span className="text-[10px] text-white-dim font-geist-mono">{date}</span>}
          </div>
          {summary && (
            <p className="text-xs text-white-dim mt-1 line-clamp-2">{summary}</p>
          )}
        </div>
      </a>
    </div>
  );
}

export function BrandIntel({ brands }: { brands: BrandData[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  const filteredBrands = selectedBrand === "all"
    ? brands
    : brands.filter((b) => b.name === selectedBrand);

  const hasAnyIntel = brands.some((b) => {
    const i = b.intel;
    return i.pressReleases.length + i.pressCoverage.length + i.activations.length + i.recentCampaigns.length + i.brandDocuments.length + i.socialPresence.length > 0;
  });

  if (!hasAnyIntel) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Brand Intelligence
        </h2>
        <div className="bg-black-deep border-2 border-border-subtle p-12 text-center">
          <Newspaper className="h-8 w-8 text-white-dim mx-auto mb-4" />
          <p className="text-white-muted text-sm mb-2">No brand intelligence data available</p>
          <p className="text-white-dim text-xs">
            Set your ANTHROPIC_API_KEY to enable Claude web search for PR, press coverage, and brand activations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Brand Intelligence
        </h2>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-white-dim" />
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
        const intel = brand.intel;
        return (
          <div key={brand.name} className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-red-hot">
              <h3 className="text-lg font-bold text-orange-accent uppercase tracking-tight">
                {brand.name}
              </h3>
              <span className="text-xs text-white-dim font-geist-mono">
                {intel.pressCoverage.length + intel.pressReleases.length} press items · {intel.activations.length} activations · {intel.recentCampaigns.length} campaigns
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <IntelCard title="Press Coverage" icon={Newspaper} count={intel.pressCoverage.length}>
                <div className="max-h-80 overflow-y-auto">
                  {intel.pressCoverage.map((item, i) => (
                    <LinkItem key={i} title={item.title} source={item.source} url={item.url} date={item.date} summary={item.summary} />
                  ))}
                </div>
              </IntelCard>

              <IntelCard title="Press Releases" icon={Quote} count={intel.pressReleases.length}>
                <div className="max-h-80 overflow-y-auto">
                  {intel.pressReleases.map((item, i) => (
                    <LinkItem key={i} title={item.title} source={item.source} url={item.url} date={item.date} summary={item.summary} />
                  ))}
                </div>
              </IntelCard>

              <IntelCard title="Brand Activations" icon={Megaphone} count={intel.activations.length}>
                <div className="max-h-80 overflow-y-auto">
                  {intel.activations.map((item, i) => (
                    <LinkItem key={i} title={item.title} url={item.url} date={item.date} summary={item.description} />
                  ))}
                </div>
              </IntelCard>

              <IntelCard title="Recent Campaigns" icon={Rocket} count={intel.recentCampaigns.length}>
                <div className="max-h-80 overflow-y-auto">
                  {intel.recentCampaigns.map((item, i) => (
                    <LinkItem key={i} title={item.name} url={item.url} date={item.date} summary={item.description} />
                  ))}
                </div>
              </IntelCard>

              <IntelCard title="Brand Documents" icon={FileText} count={intel.brandDocuments.length}>
                <div className="max-h-80 overflow-y-auto">
                  {intel.brandDocuments.map((item, i) => (
                    <LinkItem key={i} title={item.title} source={item.type} url={item.url} summary={item.summary} />
                  ))}
                </div>
              </IntelCard>

              {intel.socialPresence.length > 0 && (
                <div className="bg-black-deep border-2 border-border-subtle p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="h-4 w-4 text-orange-accent" />
                    <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
                      Social Presence
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {intel.socialPresence.map((social, i) => (
                      <a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0 hover:text-red-hot transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-orange-accent uppercase tracking-wide w-20">{social.platform}</span>
                          <span className="text-sm text-white-full group-hover:text-red-hot">{social.handle}</span>
                        </div>
                        {social.followers && (
                          <span className="text-[10px] text-white-dim font-geist-mono">{social.followers}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {intel.citations.length > 0 && (
              <details className="mt-2">
                <summary className="text-[10px] text-white-dim uppercase tracking-wide cursor-pointer hover:text-white-muted">
                  {intel.citations.length} sources cited
                </summary>
                <div className="mt-2 space-y-1 pl-4">
                  {intel.citations.slice(0, 20).map((cite, i) => (
                    <a
                      key={i}
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[10px] text-white-dim hover:text-orange-accent truncate"
                    >
                      {cite.title || cite.url}
                    </a>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
