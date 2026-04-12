export interface BrandConfig {
  name: string;
  website: string;
  facebookPage?: string;
}

export interface BrandLogo {
  primaryLogo: string | null;
  logoVariants: string[];
  favicon: string | null;
  brandName: string | null;
}

export interface BrandAd {
  adId: string;
  adText: string;
  adImageUrl: string | null;
  adVideoUrl: string | null;
  platforms: string[];
  cta: string | null;
  startDate: string | null;
  pageName: string | null;
  adUrl: string | null;
}

export interface ColorPalette {
  dominantColor: string;
  primaryColors: string[];
  secondaryColors: string[];
  rgbValues: [number, number, number][];
}

export interface BrandData {
  name: string;
  website: string;
  logos: BrandLogo;
  ads: BrandAd[];
  screenshots: string[];
  colors: ColorPalette | null;
}

export interface PhantomPerspective {
  role: string;
  verdict: "strong" | "weak" | "mixed";
  analysis: string;
  keyInsight: string;
}

export interface StrategicAnalysis {
  executiveSummary: {
    overview: string;
    keyFindings: string[];
    strategicImplications: string;
  };
  visualDna: {
    colorStrategies: Record<string, string>;
    visualDifferentiation: string;
    sharedPatterns: string[];
    uniqueElements: Record<string, string[]>;
  };
  creativeDna: {
    messagingThemes: Record<string, string[]>;
    toneAndVoice: Record<string, string>;
    creativeDirections: Record<string, string[]>;
  };
  strategicSynthesis: {
    competitivePositioning: Record<string, {
      strengths: string[];
      weaknesses: string[];
      marketPosition: string;
    }>;
    whiteSpaceOpportunities: string[];
    recommendedActions: {
      action: string;
      rationale: string;
      expectedImpact: string;
    }[];
  };
  phantomPerspectives?: PhantomPerspective[];
}

export interface AuditJob {
  id: string;
  status: "pending" | "collecting" | "analyzing" | "generating" | "complete" | "error";
  progress: number;
  currentStep: string;
  brands: BrandConfig[];
  results?: AuditResults;
  error?: string;
  createdAt: string;
}

export interface AuditResults {
  brands: BrandData[];
  strategicAnalysis: StrategicAnalysis;
  duration: number;
}

export type ProgressEvent = {
  type: "progress";
  step: string;
  progress: number;
  detail?: string;
} | {
  type: "complete";
  results: AuditResults;
} | {
  type: "error";
  message: string;
};
