import type { StrategicAnalysis as StrategicAnalysisType, BrandData } from "@/lib/types";
import { Target, MessageSquare, Compass, Zap } from "lucide-react";

export function StrategicAnalysis({
  analysis,
  brands,
}: {
  analysis: StrategicAnalysisType;
  brands: BrandData[];
}) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
        Strategic Analysis
      </h2>

      {/* Messaging Themes */}
      <div className="bg-black-deep border-2 border-border-subtle p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-4 w-4 text-orange-accent" />
          <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide">
            Messaging Themes
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(analysis.creativeDna.messagingThemes).map(([brand, themes]) => (
            <div key={brand} className="bg-black-card border border-border-subtle p-4">
              <p className="text-xs text-white-dim uppercase tracking-wide mb-3">{brand}</p>
              <ul className="space-y-2">
                {(themes as string[]).map((theme, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white-muted">
                    <span className="text-orange-accent">→</span>
                    {theme}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tone & Voice */}
      <div className="bg-black-deep border-2 border-border-subtle p-6">
        <div className="flex items-center gap-2 mb-6">
          <Compass className="h-4 w-4 text-orange-accent" />
          <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide">
            Tone &amp; Voice
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(analysis.creativeDna.toneAndVoice).map(([brand, tone]) => (
            <div key={brand} className="bg-black-card border border-border-subtle p-4">
              <p className="text-xs text-white-dim uppercase tracking-wide mb-2">{brand}</p>
              <p className="text-sm text-white-muted">{tone as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* White Space Opportunities */}
      {analysis.strategicSynthesis.whiteSpaceOpportunities.length > 0 && (
        <div className="bg-black-card border-2 border-red-hot p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-4 w-4 text-red-hot" />
            <h3 className="text-sm font-bold text-red-hot uppercase tracking-wide">
              White Space Opportunities
            </h3>
          </div>
          <ul className="space-y-3">
            {analysis.strategicSynthesis.whiteSpaceOpportunities.map((opp: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="text-red-hot font-bold font-geist-mono text-sm tabular-nums flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white-muted text-sm">{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {analysis.strategicSynthesis.recommendedActions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-accent" />
            <h3 className="text-lg font-bold text-orange-accent uppercase tracking-tight">
              Recommended Actions
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {analysis.strategicSynthesis.recommendedActions.map((rec: { action: string; rationale: string; expectedImpact: string }, i: number) => (
              <div key={i} className="bg-black-card border-2 border-border-subtle p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-bold text-red-hot font-geist-mono tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-white-full uppercase tracking-tight mb-2">
                      {rec.action}
                    </h4>
                    <p className="text-sm text-white-muted mb-2">{rec.rationale}</p>
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-accent/10 border border-orange-accent/30">
                      <span className="text-[10px] text-orange-accent uppercase tracking-wide font-bold">
                        Expected Impact:
                      </span>
                      <span className="text-[10px] text-white-muted">{rec.expectedImpact}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
