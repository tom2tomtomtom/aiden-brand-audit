"use client";

import { useState } from "react";
import type { BrandData, AnalyzedPost, SentimentAnalysis } from "@/lib/types";
import {
  ExternalLink, MessageCircle, Heart, Eye, Share2,
  TrendingUp, TrendingDown, ArrowUpDown, ThumbsUp, ThumbsDown,
  AlertTriangle, Shield, ChevronDown, ChevronUp, Quote,
} from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const platformConfig = {
  tiktok: { label: "TikTok", color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/30" },
  instagram: { label: "Instagram", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  reddit: { label: "Reddit", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
};

const sentimentColors = {
  positive: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", dot: "bg-emerald-400" },
  negative: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", dot: "bg-red-400" },
  neutral: { text: "text-zinc-400", bg: "bg-zinc-400/10", border: "border-zinc-400/30", dot: "bg-zinc-400" },
  mixed: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", dot: "bg-amber-400" },
};

// --- Sentiment Gauge ---

function SentimentGauge({ score, label }: { score: number; label: string }) {
  const normalizedPosition = ((score + 100) / 200) * 100;
  const displayLabel = label.replace("_", " ");

  let gaugeColor = "text-zinc-400";
  if (score >= 40) gaugeColor = "text-emerald-400";
  else if (score >= 10) gaugeColor = "text-emerald-300";
  else if (score >= -10) gaugeColor = "text-amber-400";
  else if (score >= -40) gaugeColor = "text-red-300";
  else gaugeColor = "text-red-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] text-white-dim uppercase tracking-widest mb-1">Sentiment Score</p>
      <div className={`text-5xl font-bold font-geist-mono ${gaugeColor}`}>
        {score > 0 ? "+" : ""}{score}
      </div>
      <div className={`text-sm font-bold uppercase tracking-wide ${gaugeColor}`}>{displayLabel}</div>
      <div className="w-full max-w-sm h-3 bg-black-card border border-border-subtle relative mt-2">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-30"
          style={{ width: "100%" }}
        />
        <div
          className={`absolute top-[-4px] w-4 h-4 border-2 border-white-full ${score >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
          style={{ left: `${Math.min(Math.max(normalizedPosition, 2), 98)}%`, transform: "translateX(-50%)" }}
        />
      </div>
      <div className="flex justify-between w-full max-w-sm text-[10px] text-white-dim font-geist-mono">
        <span>-100 Negative</span>
        <span>0</span>
        <span>+100 Positive</span>
      </div>
    </div>
  );
}

// --- Sentiment Breakdown Bar ---

function SentimentBreakdown({ breakdown }: { breakdown: SentimentAnalysis["sentimentBreakdown"] }) {
  const total = breakdown.positive + breakdown.negative + breakdown.neutral + breakdown.mixed;
  if (total === 0) return null;

  const pcts = {
    positive: Math.round((breakdown.positive / total) * 100),
    negative: Math.round((breakdown.negative / total) * 100),
    neutral: Math.round((breakdown.neutral / total) * 100),
    mixed: Math.round((breakdown.mixed / total) * 100),
  };

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden border border-border-subtle">
        {pcts.positive > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${pcts.positive}%` }} />}
        {pcts.mixed > 0 && <div className="bg-amber-500 h-full" style={{ width: `${pcts.mixed}%` }} />}
        {pcts.neutral > 0 && <div className="bg-zinc-500 h-full" style={{ width: `${pcts.neutral}%` }} />}
        {pcts.negative > 0 && <div className="bg-red-500 h-full" style={{ width: `${pcts.negative}%` }} />}
      </div>
      <div className="flex gap-4 mt-2 text-[10px] font-geist-mono">
        <span className="text-emerald-400">{pcts.positive}% positive</span>
        <span className="text-amber-400">{pcts.mixed}% mixed</span>
        <span className="text-zinc-400">{pcts.neutral}% neutral</span>
        <span className="text-red-400">{pcts.negative}% negative</span>
      </div>
    </div>
  );
}

// --- Theme Cards ---

function ThemeSection({ title, icon: Icon, themes, color }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  themes: { theme: string; frequency: string; example: string }[];
  color: "emerald" | "red";
}) {
  if (themes.length === 0) return null;
  const colors = color === "emerald"
    ? { heading: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/5", quote: "text-emerald-300" }
    : { heading: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/5", quote: "text-red-300" };

  return (
    <div className={`bg-black-deep border-2 ${colors.border} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`h-4 w-4 ${colors.heading}`} />
        <h4 className={`text-xs font-bold uppercase tracking-wide ${colors.heading}`}>{title}</h4>
      </div>
      <div className="space-y-3">
        {themes.map((t, i) => (
          <div key={i} className={`p-3 ${colors.bg} border ${colors.border}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white-full">{t.theme}</span>
              <span className="text-[10px] text-white-dim font-geist-mono">{t.frequency}</span>
            </div>
            <p className={`text-xs ${colors.quote} italic`}>&ldquo;{t.example}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Notable Quotes ---

function NotableQuotes({ quotes }: { quotes: SentimentAnalysis["notableQuotes"] }) {
  if (quotes.length === 0) return null;

  return (
    <div className="bg-black-deep border-2 border-border-subtle p-5">
      <div className="flex items-center gap-2 mb-4">
        <Quote className="h-4 w-4 text-orange-accent" />
        <h4 className="text-xs font-bold text-orange-accent uppercase tracking-wide">
          What People Are Saying
        </h4>
      </div>
      <div className="space-y-3">
        {quotes.map((q, i) => {
          const sc = sentimentColors[q.sentiment];
          const pc = platformConfig[q.platform as keyof typeof platformConfig];
          return (
            <div key={i} className={`p-3 border ${sc.border} ${sc.bg}`}>
              <p className="text-sm text-white-full italic mb-2">&ldquo;{q.text}&rdquo;</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className={`px-1.5 py-0.5 ${sc.bg} ${sc.text} border ${sc.border} uppercase font-bold`}>
                  {q.sentiment}
                </span>
                {pc && (
                  <span className={`${pc.color}`}>{pc.label}</span>
                )}
                <span className="text-white-dim">{q.author}</span>
                <span className="text-white-dim ml-auto">{q.context}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Post Card with Sentiment ---

function PostCard({ post }: { post: AnalyzedPost }) {
  const config = platformConfig[post.platform];
  const sc = sentimentColors[post.sentiment];

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-black-deep border-2 border-border-subtle hover:border-orange-accent p-4 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] px-1.5 py-0.5 uppercase tracking-wide font-bold ${config.color} ${config.bg} border ${config.border}`}>
          {config.label}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 uppercase tracking-wide font-bold ${sc.text} ${sc.bg} border ${sc.border}`}>
          {post.sentiment}
        </span>
        <span className="text-[10px] text-white-dim font-geist-mono truncate ml-auto">
          {post.author}
        </span>
      </div>
      <p className="text-xs text-white-muted line-clamp-3 mb-3 group-hover:text-white-full transition-colors">
        {post.text || "(no text)"}
      </p>
      <div className="flex items-center gap-3 text-[10px] text-white-dim font-geist-mono">
        {post.views > 0 && (
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(post.views)}</span>
        )}
        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{formatNumber(post.likes)}</span>
        {post.shares > 0 && (
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{formatNumber(post.shares)}</span>
        )}
        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatNumber(post.comments)}</span>
        {post.upvoteRatio !== undefined && (
          <span className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />{Math.round(post.upvoteRatio * 100)}%</span>
        )}
        {post.subreddit && (
          <span className="text-orange-400 ml-auto">r/{post.subreddit}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-accent opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3" />
        Open on {config.label}
      </div>
    </a>
  );
}

// --- Risks & Drivers ---

function ListSection({ title, items, icon: Icon, color }: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: "red" | "emerald";
}) {
  if (items.length === 0) return null;
  const c = color === "red"
    ? { text: "text-red-400", border: "border-red-400/30", dot: "bg-red-400" }
    : { text: "text-emerald-400", border: "border-emerald-400/30", dot: "bg-emerald-400" };

  return (
    <div className={`bg-black-deep border-2 ${c.border} p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${c.text}`} />
        <h4 className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white-muted">
            <div className={`w-1.5 h-1.5 ${c.dot} mt-1.5 flex-shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Platform Insights ---

function PlatformInsights({ insights }: { insights: SentimentAnalysis["platformInsights"] }) {
  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.map((insight, i) => {
        const config = platformConfig[insight.platform as keyof typeof platformConfig];
        return (
          <div key={i} className={`bg-black-deep border-2 ${config?.border || "border-border-subtle"} p-4`}>
            <span className={`text-xs font-bold uppercase tracking-wide ${config?.color || "text-white-dim"}`}>
              {config?.label || insight.platform}
            </span>
            <p className="text-xs text-white-dim mt-1 mb-2">{insight.dominantSentiment}</p>
            <p className="text-xs text-white-muted">{insight.keyObservation}</p>
          </div>
        );
      })}
    </div>
  );
}

// --- Main Component ---

export function SocialSentiment({ brands }: { brands: BrandData[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0]?.name || "all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [showAllPosts, setShowAllPosts] = useState(false);

  const hasSocial = brands.some((b) => b.social && b.social.summary.totalPosts > 0);

  if (!hasSocial) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Public Sentiment
        </h2>
        <div className="bg-black-deep border-2 border-border-subtle p-12 text-center">
          <TrendingUp className="h-8 w-8 text-white-dim mx-auto mb-4" />
          <p className="text-white-muted text-sm mb-2">No social data collected</p>
          <p className="text-white-dim text-xs">
            Requires SCRAPE_CREATORS_API_KEY and ANTHROPIC_API_KEY for sentiment analysis.
          </p>
        </div>
      </div>
    );
  }

  const displayBrands = selectedBrand === "all" ? brands : brands.filter((b) => b.name === selectedBrand);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
            Public Sentiment
          </h2>
          <p className="text-xs text-white-dim mt-1">
            How the internet actually talks about {brands.length > 1 ? "these brands" : brands[0]?.name}
          </p>
        </div>
        {brands.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBrand("all")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                selectedBrand === "all"
                  ? "border-red-hot text-red-hot"
                  : "border-border-subtle text-white-dim hover:text-white-muted"
              }`}
            >
              Compare
            </button>
            {brands.map((b) => (
              <button
                key={b.name}
                onClick={() => setSelectedBrand(b.name)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                  selectedBrand === b.name
                    ? "border-red-hot text-red-hot"
                    : "border-border-subtle text-white-dim hover:text-white-muted"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comparison view */}
      {selectedBrand === "all" && brands.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {brands.map((brand) => {
            const s = brand.social?.sentiment;
            return (
              <div key={brand.name} className="bg-black-deep border-2 border-border-subtle p-6">
                <h3 className="text-lg font-bold text-orange-accent uppercase tracking-tight mb-4">
                  {brand.name}
                </h3>
                {s ? (
                  <>
                    <SentimentGauge score={s.overallScore} label={s.overallLabel} />
                    <div className="mt-4">
                      <SentimentBreakdown breakdown={s.sentimentBreakdown} />
                    </div>
                    <p className="text-xs text-white-muted mt-4 leading-relaxed">{s.brandPerception}</p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-white-dim">No sentiment data available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Per-brand detailed view */}
      {displayBrands.map((brand) => {
        const s = brand.social?.sentiment;
        if (!brand.social || !s) {
          return (
            <div key={brand.name} className="bg-black-deep border-2 border-border-subtle p-8 text-center">
              <TrendingUp className="h-6 w-6 text-white-dim mx-auto mb-3" />
              <p className="text-sm text-white-muted">No sentiment data for {brand.name}</p>
              <p className="text-xs text-white-dim mt-1">Social analysis was not available for this audit.</p>
            </div>
          );
        }

        const allPosts = s.posts || [];
        const filteredPosts = sentimentFilter === "all"
          ? allPosts
          : allPosts.filter((p) => p.sentiment === sentimentFilter);
        const visiblePosts = showAllPosts ? filteredPosts : filteredPosts.slice(0, 9);

        return (
          <div key={brand.name} className="space-y-6">
            {selectedBrand !== "all" && (
              <>
                {/* Sentiment Score */}
                <div className="bg-black-deep border-2 border-border-subtle p-6">
                  <SentimentGauge score={s.overallScore} label={s.overallLabel} />
                  <div className="mt-6">
                    <SentimentBreakdown breakdown={s.sentimentBreakdown} />
                  </div>
                  <p className="text-sm text-white-muted mt-4 leading-relaxed max-w-3xl mx-auto text-center">
                    {s.brandPerception}
                  </p>
                  <p className="text-[10px] text-white-dim mt-2 text-center font-geist-mono">
                    Based on {s.totalAnalyzed} organic posts from TikTok, Instagram & Reddit
                  </p>
                </div>

                {/* Platform Insights */}
                <PlatformInsights insights={s.platformInsights} />
              </>
            )}

            {/* Themes: What People Love vs Hate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ThemeSection
                title="What People Love"
                icon={ThumbsUp}
                themes={s.themes.positive}
                color="emerald"
              />
              <ThemeSection
                title="What People Hate"
                icon={ThumbsDown}
                themes={s.themes.negative}
                color="red"
              />
            </div>

            {/* Notable Quotes */}
            <NotableQuotes quotes={s.notableQuotes} />

            {/* Risks & Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ListSection
                title="Reputation Risks"
                items={s.reputationRisks}
                icon={AlertTriangle}
                color="red"
              />
              <ListSection
                title="Advocacy Drivers"
                items={s.advocacyDrivers}
                icon={Shield}
                color="emerald"
              />
            </div>

            {/* Posts Grid with Sentiment Filter */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b-2 border-red-hot pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-hot" />
                  <h3 className="text-sm font-bold text-red-hot uppercase tracking-tight">
                    Organic Posts
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {["all", "positive", "negative", "mixed", "neutral"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setSentimentFilter(f)}
                      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide border transition-all ${
                        sentimentFilter === f
                          ? f === "positive" ? "border-emerald-400 text-emerald-400"
                            : f === "negative" ? "border-red-400 text-red-400"
                            : f === "mixed" ? "border-amber-400 text-amber-400"
                            : f === "neutral" ? "border-zinc-400 text-zinc-400"
                            : "border-white-muted text-white-muted"
                          : "border-border-subtle text-white-dim hover:text-white-muted"
                      }`}
                    >
                      {f}
                      {f !== "all" && (
                        <span className="ml-1 font-geist-mono">
                          {allPosts.filter((p) => p.sentiment === f).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visiblePosts.map((post) => (
                  <PostCard key={`${post.platform}-${post.id}`} post={post} />
                ))}
              </div>
              {filteredPosts.length > 9 && (
                <button
                  onClick={() => setShowAllPosts(!showAllPosts)}
                  className="mt-4 w-full py-2 text-xs font-bold uppercase tracking-wide text-orange-accent border-2 border-border-subtle hover:border-orange-accent transition-all flex items-center justify-center gap-2"
                >
                  {showAllPosts ? (
                    <><ChevronUp className="h-3 w-3" /> Show Less</>
                  ) : (
                    <><ChevronDown className="h-3 w-3" /> Show All {filteredPosts.length} Posts</>
                  )}
                </button>
              )}
              {filteredPosts.length === 0 && (
                <div className="text-center py-8 text-white-dim text-xs uppercase tracking-wide">
                  No {sentimentFilter} posts found
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
