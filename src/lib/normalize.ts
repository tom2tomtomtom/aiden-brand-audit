import type { StrategicAnalysis } from "./types";

// The strategic analysis is produced by an LLM and is NOT guaranteed to match
// the StrategicAnalysis shape at runtime: the model can omit fields or truncate
// its JSON (max_tokens). Consuming components read `.length` and Object.entries
// on nested arrays/objects, so a missing field crashes the whole report view and
// the PDF export. This rebuilds the full typed contract with safe defaults,
// overlaying whatever valid values the model did return.

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function strRecord(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(obj(v))) out[k] = str(val);
  return out;
}

function strArrayRecord(v: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, val] of Object.entries(obj(v))) out[k] = strArray(val);
  return out;
}

export function normalizeStrategicAnalysis(raw: unknown): StrategicAnalysis {
  const a = obj(raw);
  const exec = obj(a.executiveSummary);
  const visual = obj(a.visualDna);
  const creative = obj(a.creativeDna);
  const synth = obj(a.strategicSynthesis);

  const competitivePositioning: StrategicAnalysis["strategicSynthesis"]["competitivePositioning"] = {};
  for (const [brand, val] of Object.entries(obj(synth.competitivePositioning))) {
    const p = obj(val);
    competitivePositioning[brand] = {
      strengths: strArray(p.strengths),
      weaknesses: strArray(p.weaknesses),
      marketPosition: str(p.marketPosition),
    };
  }

  const recommendedActions = (Array.isArray(synth.recommendedActions) ? synth.recommendedActions : []).map((r) => {
    const o = obj(r);
    return { action: str(o.action), rationale: str(o.rationale), expectedImpact: str(o.expectedImpact) };
  });

  return {
    executiveSummary: {
      overview: str(exec.overview),
      keyFindings: strArray(exec.keyFindings),
      strategicImplications: str(exec.strategicImplications),
    },
    visualDna: {
      colorStrategies: strRecord(visual.colorStrategies),
      visualDifferentiation: str(visual.visualDifferentiation),
      sharedPatterns: strArray(visual.sharedPatterns),
      uniqueElements: strArrayRecord(visual.uniqueElements),
    },
    creativeDna: {
      messagingThemes: strArrayRecord(creative.messagingThemes),
      toneAndVoice: strRecord(creative.toneAndVoice),
      creativeDirections: strArrayRecord(creative.creativeDirections),
    },
    strategicSynthesis: {
      competitivePositioning,
      whiteSpaceOpportunities: strArray(synth.whiteSpaceOpportunities),
      recommendedActions,
    },
    phantomPerspectives: Array.isArray(a.phantomPerspectives)
      ? (a.phantomPerspectives as StrategicAnalysis["phantomPerspectives"])
      : undefined,
  };
}

export function normalizeAuditResults<T extends object>(
  results: T,
): T & { strategicAnalysis: StrategicAnalysis } {
  return {
    ...results,
    strategicAnalysis: normalizeStrategicAnalysis((results as { strategicAnalysis?: unknown }).strategicAnalysis),
  };
}
