export interface BrandConfig {
  name: string;
  website: string;
  facebookPage?: string;
  facebookPageId?: string;
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
  headline: string | null;
  adImageUrl: string | null;
  adVideoUrl: string | null;
  platforms: string[];
  cta: string | null;
  ctaType: string | null;
  startDate: string | null;
  pageName: string | null;
  adUrl: string | null;
  allImageUrls: string[];
  displayFormat: string;
  linkUrl: string | null;
  isVideo: boolean;
  isCarousel: boolean;
}

export interface AdAnalytics {
  totalAds: number;
  platformBreakdown: Record<string, number>;
  ctaBreakdown: Record<string, number>;
  formatBreakdown: Record<string, number>;
  videoPercent: number;
  carouselPercent: number;
  imagePercent: number;
  avgCopyLength: number;
  dateRange: { earliest: string | null; latest: string | null };
  topCtas: { cta: string; count: number; percent: number }[];
  topPlatforms: { platform: string; count: number; percent: number }[];
  confirmedPageName: string | null;
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
  adCreativeUrls: string[];
  colors: ColorPalette | null;
  adColors: ColorPalette | null;
  analytics: AdAnalytics;
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
  id: string;
  brands: BrandData[];
  strategicAnalysis: StrategicAnalysis;
  duration: number;
  createdAt: string;
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
