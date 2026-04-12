"use client";

import { useState } from "react";
import type { BrandData, SocialPost } from "@/lib/types";
import { ExternalLink, MessageCircle, Heart, Eye, Share2, TrendingUp, ArrowUpDown } from "lucide-react";

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

function PostCard({ post }: { post: SocialPost }) {
  const config = platformConfig[post.platform];
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-black-deep border-2 border-border-subtle hover:border-orange-accent p-4 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wide font-bold ${config.color} ${config.bg} border ${config.border}`}>
          {config.label}
        </span>
        <span className="text-[10px] text-white-dim font-geist-mono truncate">
          {post.author}
        </span>
        {post.region && (
          <span className="text-[10px] text-white-dim ml-auto">{post.region}</span>
        )}
        {post.subreddit && (
          <span className="text-[10px] text-orange-accent ml-auto">r/{post.subreddit}</span>
        )}
      </div>
      <p className="text-xs text-white-muted line-clamp-3 mb-3 group-hover:text-white-full transition-colors">
        {post.text || "(no text)"}
      </p>
      <div className="flex items-center gap-4 text-[10px] text-white-dim font-geist-mono">
        {post.views > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatNumber(post.views)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          {formatNumber(post.likes)}
        </span>
        {post.shares > 0 && (
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            {formatNumber(post.shares)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {formatNumber(post.comments)}
        </span>
        {post.upvoteRatio !== undefined && (
          <span className="flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            {Math.round(post.upvoteRatio * 100)}%
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-accent opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="h-3 w-3" />
        Open on {config.label}
      </div>
    </a>
  );
}

function PlatformStats({ brands }: { brands: BrandData[] }) {
  const platforms = ["tiktok", "instagram", "reddit"] as const;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {platforms.map((platform) => {
        const config = platformConfig[platform];
        const totalPosts = brands.reduce((sum, b) => sum + (b.social?.[platform]?.length || 0), 0);
        const totalEngagement = brands.reduce(
          (sum, b) => sum + (b.social?.[platform]?.reduce((s, p) => s + p.likes + p.comments + p.shares, 0) || 0),
          0,
        );
        return (
          <div key={platform} className={`bg-black-deep border-2 ${config.border} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-white-dim uppercase tracking-wide">Posts</span>
                <span className="text-sm font-bold text-white-full font-geist-mono">{totalPosts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-white-dim uppercase tracking-wide">Engagement</span>
                <span className="text-sm font-bold text-white-full font-geist-mono">{formatNumber(totalEngagement)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SocialSentiment({ brands }: { brands: BrandData[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const hasSocial = brands.some((b) => b.social && b.social.summary.totalPosts > 0);

  if (!hasSocial) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
          Social Sentiment
        </h2>
        <div className="bg-black-deep border-2 border-border-subtle p-12 text-center">
          <TrendingUp className="h-8 w-8 text-white-dim mx-auto mb-4" />
          <p className="text-white-muted text-sm mb-2">No social data collected</p>
          <p className="text-white-dim text-xs">
            Social sentiment scraping requires SCRAPE_CREATORS_API_KEY.
          </p>
        </div>
      </div>
    );
  }

  const filteredBrands = selectedBrand === "all"
    ? brands
    : brands.filter((b) => b.name === selectedBrand);

  const allPosts: (SocialPost & { brandName: string })[] = filteredBrands.flatMap((b) => {
    if (!b.social) return [];
    const posts = [
      ...b.social.tiktok,
      ...b.social.instagram,
      ...b.social.reddit,
    ];
    return posts.map((p) => ({ ...p, brandName: b.name }));
  });

  const filteredPosts = platformFilter === "all"
    ? allPosts
    : allPosts.filter((p) => p.platform === platformFilter);

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares),
  );

  const totalEngagement = allPosts.reduce((s, p) => s + p.likes + p.comments + p.shares, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
            Social Sentiment
          </h2>
          <p className="text-xs text-white-dim mt-1">
            {allPosts.length} organic posts · {formatNumber(totalEngagement)} total engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-black-card border border-border-subtle text-white-full px-3 py-1.5 text-xs uppercase tracking-wide"
          >
            <option value="all">All Platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="reddit">Reddit</option>
          </select>
        </div>
      </div>

      <PlatformStats brands={filteredBrands} />

      {filteredBrands.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBrands.map((brand) => {
            if (!brand.social) return null;
            const s = brand.social.summary;
            return (
              <div key={brand.name} className="bg-black-deep border-2 border-border-subtle p-4">
                <h3 className="text-sm font-bold text-orange-accent uppercase tracking-tight mb-3">
                  {brand.name}
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {s.platformBreakdown.map((pb) => {
                    const config = platformConfig[pb.platform as keyof typeof platformConfig];
                    return (
                      <div key={pb.platform}>
                        <span className={`text-[10px] ${config?.color || "text-white-dim"} uppercase tracking-wide`}>
                          {config?.label || pb.platform}
                        </span>
                        <div className="text-lg font-bold text-white-full font-geist-mono">{pb.posts}</div>
                        <div className="text-[10px] text-white-dim">{formatNumber(pb.engagement)} eng.</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4 border-b-2 border-red-hot pb-2">
          <TrendingUp className="h-4 w-4 text-red-hot" />
          <h3 className="text-sm font-bold text-red-hot uppercase tracking-tight">
            Top Posts by Engagement
          </h3>
          <span className="text-[10px] text-white-dim font-geist-mono ml-auto">
            {sortedPosts.length} posts
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedPosts.slice(0, 18).map((post) => (
            <PostCard key={`${post.platform}-${post.id}`} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
