import type { StrategicAnalysis as StrategicAnalysisType } from "@/lib/types";
import { TrendingUp, Lightbulb } from "lucide-react";

export function ExecutiveSummary({ analysis }: { analysis: StrategicAnalysisType }) {
  const { executiveSummary } = analysis;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
        Executive Summary
      </h2>

      <div className="bg-black-deep border-2 border-border-subtle p-6">
        <p className="text-white-muted text-base leading-relaxed">
          {executiveSummary.overview}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black-card border-2 border-border-subtle p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-orange-accent" />
            <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide">
              Key Findings
            </h3>
          </div>
          <ul className="space-y-3">
            {executiveSummary.keyFindings.map((finding: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="text-red-hot font-bold font-geist-mono text-sm tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white-muted text-sm">{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-black-card border-2 border-border-subtle p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-orange-accent" />
            <h3 className="text-sm font-bold text-orange-accent uppercase tracking-wide">
              Strategic Implications
            </h3>
          </div>
          <p className="text-white-muted text-sm leading-relaxed">
            {executiveSummary.strategicImplications}
          </p>
        </div>
      </div>
    </div>
  );
}
