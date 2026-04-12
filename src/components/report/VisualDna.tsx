import type { BrandData, StrategicAnalysis as StrategicAnalysisType } from "@/lib/types";
import { getContrastColor } from "@/lib/utils";

export function VisualDna({
  brands,
  analysis,
}: {
  brands: BrandData[];
  analysis: StrategicAnalysisType;
}) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
        Visual DNA Comparison
      </h2>

      {/* Color Palettes Side by Side */}
      <div className="bg-black-deep border-2 border-border-subtle p-6">
        <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide mb-6">
          Color Palettes
        </h3>
        <div className="space-y-6">
          {brands.map((brand) => (
            <div key={brand.name}>
              <p className="text-xs text-white-dim uppercase tracking-wide mb-2">{brand.name}</p>
              <div className="flex gap-2">
                {brand.colors ? (
                  [...brand.colors.primaryColors, ...brand.colors.secondaryColors].map((color, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className="h-16 border border-border-subtle flex items-end p-1"
                        style={{ backgroundColor: color }}
                      >
                        <span
                          className="text-[9px] font-geist-mono"
                          style={{ color: getContrastColor(color) }}
                        >
                          {color}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white-dim">No color data available</p>
                )}
              </div>
              {analysis.visualDna.colorStrategies[brand.name] && (
                <p className="text-xs text-white-muted mt-2">
                  {analysis.visualDna.colorStrategies[brand.name]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visual Differentiation */}
      {analysis.visualDna.visualDifferentiation && (
        <div className="bg-black-card border-2 border-border-subtle p-6">
          <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide mb-3">
            Visual Differentiation
          </h3>
          <p className="text-white-muted text-sm leading-relaxed">
            {analysis.visualDna.visualDifferentiation}
          </p>
        </div>
      )}

      {/* Shared Patterns + Unique Elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analysis.visualDna.sharedPatterns.length > 0 && (
          <div className="bg-black-card border-2 border-border-subtle p-6">
            <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide mb-3">
              Shared Patterns
            </h3>
            <ul className="space-y-2">
              {analysis.visualDna.sharedPatterns.map((pattern: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-white-muted">
                  <span className="text-red-hot">—</span>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-black-card border-2 border-border-subtle p-6">
          <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide mb-3">
            Unique Elements
          </h3>
          <div className="space-y-4">
            {Object.entries(analysis.visualDna.uniqueElements).map(([brand, elements]) => (
              <div key={brand}>
                <p className="text-xs text-white-dim uppercase tracking-wide mb-1">{brand}</p>
                <ul className="space-y-1">
                  {(elements as string[]).map((el, i) => (
                    <li key={i} className="text-sm text-white-muted">• {el}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screenshot Galleries */}
      {brands.some((b) => b.screenshots.length > 0) && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-orange-accent uppercase tracking-tight">
            Visual Assets
          </h3>
          {brands.map((brand) =>
            brand.screenshots.length > 0 ? (
              <div key={brand.name}>
                <p className="text-xs text-white-dim uppercase tracking-wide mb-3">{brand.name}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {brand.screenshots.slice(0, 12).map((url, i) => (
                    <div key={i} className="aspect-square bg-black-card border border-border-subtle overflow-hidden">
                      <img
                        src={url}
                        alt={`${brand.name} ad creative ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
