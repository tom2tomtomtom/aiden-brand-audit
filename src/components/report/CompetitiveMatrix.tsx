import type { StrategicAnalysis as StrategicAnalysisType, BrandData } from "@/lib/types";
import { Shield, AlertTriangle, MapPin } from "lucide-react";

export function CompetitiveMatrix({
  analysis,
  brands,
}: {
  analysis: StrategicAnalysisType;
  brands: BrandData[];
}) {
  const positioning = analysis.strategicSynthesis.competitivePositioning;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
        Competitive Matrix
      </h2>

      {/* Positioning cards */}
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(positioning).map(([brand, data]) => {
          const brandData = brands.find((b) => b.name === brand);
          const pos = data as { strengths: string[]; weaknesses: string[]; marketPosition: string };

          return (
            <div key={brand} className="bg-black-deep border-2 border-border-subtle hover:border-orange-accent transition-all">
              {/* Brand header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-border-subtle">
                <div className="flex items-center gap-4">
                  {brandData?.logos.primaryLogo ? (
                    <img
                      src={brandData.logos.primaryLogo}
                      alt={brand}
                      className="h-8 max-w-[80px] object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-black-card border border-border-subtle flex items-center justify-center">
                      <span className="text-red-hot font-bold text-sm">{brand[0]}</span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white-full uppercase tracking-tight">
                    {brand}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-orange-accent" />
                  <span className="text-xs text-white-muted">{pos.marketPosition}</span>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-orange-accent" />
                    <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
                      Strengths
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {pos.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white-muted">
                        <span className="text-orange-accent flex-shrink-0">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-hot" />
                    <h4 className="text-xs font-bold text-red-hot uppercase tracking-wide">
                      Weaknesses
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {pos.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white-muted">
                        <span className="text-red-hot flex-shrink-0">−</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats comparison table */}
      <div className="bg-black-card border-2 border-border-subtle overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-red-hot">
              <th className="text-left text-xs font-bold text-white-dim uppercase tracking-wide p-4">
                Metric
              </th>
              {brands.map((b) => (
                <th key={b.name} className="text-center text-xs font-bold text-orange-accent uppercase tracking-wide p-4">
                  {b.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="text-xs text-white-muted uppercase tracking-wide p-4">Total Ads</td>
              {brands.map((b) => (
                <td key={b.name} className="text-center text-sm font-bold text-red-hot tabular-nums p-4">
                  {b.ads.length}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="text-xs text-white-muted uppercase tracking-wide p-4">Ad Images</td>
              {brands.map((b) => (
                <td key={b.name} className="text-center text-sm font-bold text-red-hot tabular-nums p-4">
                  {b.screenshots.length}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-subtle">
              <td className="text-xs text-white-muted uppercase tracking-wide p-4">Colors Extracted</td>
              {brands.map((b) => (
                <td key={b.name} className="text-center text-sm font-bold text-red-hot tabular-nums p-4">
                  {b.colors ? b.colors.primaryColors.length + b.colors.secondaryColors.length : 0}
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-xs text-white-muted uppercase tracking-wide p-4">Dominant Color</td>
              {brands.map((b) => (
                <td key={b.name} className="text-center p-4">
                  {b.colors ? (
                    <div className="inline-flex items-center gap-2">
                      <div
                        className="h-4 w-4 border border-border-subtle"
                        style={{ backgroundColor: b.colors.dominantColor }}
                      />
                      <span className="text-xs font-geist-mono text-white-dim">
                        {b.colors.dominantColor}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-white-dim">N/A</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
