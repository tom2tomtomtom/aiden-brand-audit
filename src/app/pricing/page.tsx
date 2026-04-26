"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// AIDEN moved to unified token billing across all hub apps in April 2026.
// Brand Audit is metered against the shared token balance held by Gateway.
// There are no per-product subscriptions any more. The "Get tokens" button
// below routes users to the Gateway pricing page where token packs and
// subscriptions are sold.
// Source of truth for costs: aiden-gateway/lib/tokens.ts (brand_audit key).

const TOKEN_COSTS = {
  per_brand: 40,
  strategic_analysis: 20,
} as const;

const FREE_TOKEN_GRANT = 200;

const GATEWAY_PRICING_URL = "https://www.aiden.services/pricing";

export default function PricingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black-ink">
      <header className="border-b-2 border-red-hot bg-black-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <h1 className="text-xl font-bold text-red-hot uppercase tracking-tight">
                AIDEN BRAND AUDIT
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="bg-red-hot px-4 py-2 text-sm font-bold text-white hover:bg-red-dim transition-colors uppercase tracking-wide"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <a
                    href="https://www.aiden.services/login?next=https%3A%2F%2Fbrandaudit.aiden.services%2Fdashboard"
                    className="text-sm text-white-muted hover:text-white transition-colors uppercase tracking-wide"
                  >
                    Sign in
                  </a>
                  <a
                    href="https://www.aiden.services/login?next=https%3A%2F%2Fbrandaudit.aiden.services%2Fdashboard"
                    className="bg-red-hot px-4 py-2 text-sm font-bold text-white hover:bg-red-dim transition-colors uppercase tracking-wide"
                  >
                    Get started
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-red-hot uppercase tracking-tight">
            Brand Audit runs on tokens
          </h2>
          <p className="mt-4 text-lg text-white-muted max-w-2xl mx-auto">
            Pay for what you use. One shared token balance across every AIDEN tool.
            No per-product subscriptions, no monthly minimums.
          </p>
        </div>

        {/* Per-operation costs */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black-deep border-2 border-border-subtle p-8">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-5xl font-bold text-orange-accent font-geist-mono">
                  {TOKEN_COSTS.per_brand}
                </span>
                <span className="text-sm text-white-muted uppercase tracking-widest">tokens</span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
                Per brand audited
              </h3>
              <p className="text-sm text-white-muted">
                Logo scraping, Facebook Ad Library, colour DNA extraction, brand intel,
                and social sentiment. All real data sources.
              </p>
            </div>

            <div className="bg-black-deep border-2 border-border-subtle p-8">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-5xl font-bold text-orange-accent font-geist-mono">
                  {TOKEN_COSTS.strategic_analysis}
                </span>
                <span className="text-sm text-white-muted uppercase tracking-widest">tokens</span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
                Strategic analysis
              </h3>
              <p className="text-sm text-white-muted">
                AIDEN synthesises competitive positioning, white-space opportunities,
                and recommended actions across all audited brands.
              </p>
            </div>
          </div>

          <div className="mt-4 border-2 border-border-subtle bg-black-deep p-5 text-center">
            <p className="text-sm text-white-dim font-geist-mono">
              Example: 3 brands = ({TOKEN_COSTS.per_brand} &times; 3) + {TOKEN_COSTS.strategic_analysis} ={" "}
              <span className="text-orange-accent font-bold">
                {TOKEN_COSTS.per_brand * 3 + TOKEN_COSTS.strategic_analysis} tokens
              </span>
            </p>
          </div>
        </div>

        {/* Free trial card */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-black-deep border-2 border-orange-accent p-8 text-center">
            <span className="text-[10px] font-bold text-orange-accent uppercase tracking-widest border border-orange-accent px-2 py-0.5 inline-block mb-4">
              New users
            </span>
            <h3 className="text-2xl font-bold text-white uppercase mb-3">
              {FREE_TOKEN_GRANT} tokens free
            </h3>
            <p className="text-sm text-white-muted mb-2">
              Every new AIDEN account gets {FREE_TOKEN_GRANT} tokens on sign-up. One-time grant,
              never expires.
            </p>
            <p className="text-xs text-white-dim font-geist-mono">
              ≈ {Math.floor(FREE_TOKEN_GRANT / (TOKEN_COSTS.per_brand + TOKEN_COSTS.strategic_analysis))} full single-brand audits
            </p>
            {!isAuthenticated && (
              <a
                href="https://www.aiden.services/login?next=https%3A%2F%2Fbrandaudit.aiden.services%2Fdashboard"
                className="mt-6 inline-block py-3 px-8 font-bold text-sm uppercase tracking-wide transition-all bg-red-hot text-white border-2 border-red-hot hover:bg-red-dim"
              >
                Start free
              </a>
            )}
          </div>
        </div>

        {/* Get tokens CTA */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-black-deep border-2 border-red-hot p-10 text-center">
            <h3 className="text-2xl font-bold text-white uppercase mb-3">Need more tokens?</h3>
            <p className="text-sm text-white-muted mb-6">
              Subscriptions or one-off token packs. Buy through the AIDEN Hub,
              use across every tool.
            </p>
            <a
              href={GATEWAY_PRICING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-4 px-10 font-bold text-base uppercase tracking-wide bg-red-hot text-white border-2 border-red-hot hover:bg-red-dim transition-colors"
            >
              Get tokens on AIDEN Hub
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-4 text-xs text-white-dim uppercase tracking-wide">
              Opens AIDEN Hub pricing
            </p>
          </div>
        </div>

        {/* How Tokens Work */}
        <div className="max-w-2xl mx-auto mt-4 border-2 border-border-subtle bg-black-deep p-8">
          <h3 className="text-lg font-bold text-white uppercase mb-4">How Tokens Work</h3>
          <div className="space-y-3 text-sm text-white-muted">
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">01</span>
              <p>Each brand audit costs tokens based on the number of brands analyzed. More brands = more API calls = more tokens.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">02</span>
              <p>Every AIDEN tool charges against your shared token balance. Brief Intelligence, Brand Audit, Pitch, Listen, Synthetic Research, all of it.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">03</span>
              <p>Subscription plans grant tokens monthly. One-off packs let you top up without a subscription. Both buyable through AIDEN Hub.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">04</span>
              <p>Tokens cover real costs: Facebook Ad Library scraping, logo analysis, AI-powered strategic intelligence, and more.</p>
            </div>
          </div>
        </div>

        {/* Authenticated billing link */}
        {isAuthenticated && (
          <div className="max-w-md mx-auto mt-12 text-center space-y-3">
            <a
              href={GATEWAY_PRICING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border-subtle bg-black-deep px-5 py-2.5 text-sm font-medium text-white-muted hover:text-white hover:border-white transition-colors"
            >
              Manage billing on AIDEN Hub
            </a>
            <p className="text-xs text-white-dim">
              <Link
                href="/dashboard"
                className="text-orange-accent hover:text-red-hot transition-colors"
              >
                Back to dashboard
              </Link>
            </p>
          </div>
        )}

        <p className="text-center text-sm text-white-dim mt-8 uppercase tracking-wide">
          Payments processed securely by Stripe through AIDEN Hub. Cancel anytime.
        </p>
      </section>
    </div>
  );
}
