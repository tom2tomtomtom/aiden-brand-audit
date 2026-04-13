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

export interface BrandIntel {
  pressReleases: { title: string; source: string; url: string; date: string; summary: string }[];
  pressCoverage: { title: string; source: string; url: string; date: string; summary: string }[];
  activations: { title: string; description: string; url: string; date: string }[];
  brandDocuments: { title: string; type: string; url: string; summary: string }[];
  socialPresence: { platform: string; handle: string; url: string; followers?: string }[];
  recentCampaigns: { name: string; description: string; url: string; date: string }[];
  citations: { url: string; title: string }[];
}

export interface SocialPost {
  platform: "tiktok" | "instagram" | "reddit";
  id: string;
  author: string;
  text: string;
  url: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  region?: string;
  subreddit?: string;
  upvoteRatio?: number;
}

export interface AnalyzedPost extends SocialPost {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sentimentScore: number;
}

export interface SentimentAnalysis {
  overallScore: number;
  overallLabel: "very_negative" | "negative" | "mixed" | "neutral" | "positive" | "very_positive";
  totalAnalyzed: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  themes: {
    positive: { theme: string; frequency: string; example: string }[];
    negative: { theme: string; frequency: string; example: string }[];
  };
  notableQuotes: {
    text: string;
    sentiment: "positive" | "negative" | "mixed";
    platform: string;
    author: string;
    context: string;
  }[];
  brandPerception: string;
  reputationRisks: string[];
  advocacyDrivers: string[];
  platformInsights: {
    platform: string;
    dominantSentiment: string;
    keyObservation: string;
  }[];
  posts: AnalyzedPost[];
}

export interface SocialSentiment {
  tiktok: SocialPost[];
  instagram: SocialPost[];
  reddit: SocialPost[];
  sentiment: SentimentAnalysis | null;
  summary: {
    totalPosts: number;
    totalEngagement: number;
    platformBreakdown: { platform: string; posts: number; engagement: number }[];
    topPost: SocialPost | null;
  };
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
  intel: BrandIntel;
  social: SocialSentiment | null;
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
