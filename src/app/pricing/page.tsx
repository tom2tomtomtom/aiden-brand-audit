"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Coins, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { PlanKey } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    tokens: "100",
    tokenDetail: "tokens/month",
    description: "Try it out — ~1 audit",
    features: [
      "100 tokens per month",
      "2-5 brands per audit",
      "Ad Library scraping",
      "Color DNA extraction",
      "Basic AIDEN analysis",
    ],
    cta: "Get started",
    href: "/register",
    highlight: false,
    plan: null,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    tokens: "1,500",
    tokenDetail: "tokens/month",
    description: "For active teams — ~10 audits",
    features: [
      "1,500 tokens per month",
      "2-5 brands per audit",
      "Full AIDEN strategic analysis",
      "Brand Intel (PR, press, campaigns)",
      "Social Pulse sentiment analysis",
      "Ad analytics dashboard",
      "PDF export & share links",
      "Top up tokens via AIDEN Hub",
    ],
    cta: "Subscribe",
    href: null,
    highlight: true,
    plan: "pro" as PlanKey,
  },
  {
    name: "Agency",
    price: "$199",
    period: "/month",
    tokens: "5,000",
    tokenDetail: "tokens/month",
    description: "For agencies — ~35 audits",
    features: [
      "5,000 tokens per month",
      "Everything in Pro",
      "White-label reports",
      "Bulk audit API access",
      "Team seats (coming soon)",
      "Dedicated support",
      "Top up tokens via AIDEN Hub",
    ],
    cta: "Subscribe",
    href: null,
    highlight: false,
    plan: "agency" as PlanKey,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  async function handleCheckout(plan: PlanKey) {
    if (!isLoggedIn) {
      toast.error("Please sign in first to purchase a plan.");
      router.push("/login");
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        redirect: "error",
        body: JSON.stringify({ plan }),
      });

      if (res.status === 401) {
        toast.error("Session expired. Redirecting to login...");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = `Server error (${res.status})`;
        try { errorMsg = JSON.parse(text).error || errorMsg; } catch { /* not JSON */ }
        toast.error(errorMsg);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      if (err instanceof TypeError && err.message.includes("redirect")) {
        toast.error("Session expired. Please sign in again.");
        router.push("/login");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(null);
    }
  }

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
              {isLoggedIn ? (
                <Link href="/dashboard" className="bg-red-hot px-4 py-2 text-sm font-bold text-white hover:bg-red-dim transition-colors uppercase tracking-wide">
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
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-red-hot uppercase tracking-tight">
            Token-Based Pricing
          </h2>
          <p className="mt-4 text-lg text-white-muted uppercase tracking-wide">
            Pay for what you use. Every audit costs tokens.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white-dim font-geist-mono">
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-orange-accent" />
              2 brands ≈ 170 tokens
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-orange-accent" />
              3 brands ≈ 230 tokens
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-orange-accent" />
              5 brands ≈ 350 tokens
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border-2 p-8 flex flex-col ${
                tier.highlight
                  ? "border-red-hot bg-red-hot/5"
                  : "border-border-subtle bg-black-deep"
              }`}
            >
              {tier.highlight && (
                <span className="self-start text-[10px] font-bold text-red-hot uppercase tracking-widest mb-4 border border-red-hot px-2 py-0.5">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-white uppercase">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && (
                  <span className="text-sm text-white-dim">{tier.period}</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-orange-accent" />
                <span className="text-sm font-bold text-orange-accent font-geist-mono">
                  {tier.tokens}
                </span>
                <span className="text-xs text-white-dim">{tier.tokenDetail}</span>
              </div>
              <p className="mt-2 text-sm text-white-dim">{tier.description}</p>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white-muted">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-hot" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {tier.href ? (
                  <Link
                    href={tier.href}
                    className="block w-full px-4 py-3 text-center text-sm font-bold uppercase tracking-wide transition-colors border-2 border-border-subtle text-white hover:bg-white/5"
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => tier.plan && handleCheckout(tier.plan)}
                    disabled={loading === tier.plan}
                    className={`block w-full px-4 py-3 text-center text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${
                      tier.highlight
                        ? "bg-red-hot text-white hover:bg-red-dim border-2 border-red-hot"
                        : "border-2 border-border-subtle text-white hover:bg-white/5"
                    }`}
                  >
                    {loading === tier.plan ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      tier.cta
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-20">
          <div className="border-2 border-border-subtle bg-black-deep p-8 text-center">
            <Coins className="h-6 w-6 text-orange-accent mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white uppercase mb-2">
              Token Balance
            </h3>
            <p className="text-sm text-white-dim mb-4">
              Token balance is managed through AIDEN Hub.
            </p>
            <a
              href="https://www.aiden.services/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-accent text-black font-bold text-sm uppercase tracking-wide hover:bg-orange-accent/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Get Tokens on AIDEN Hub
            </a>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-20 border-2 border-border-subtle bg-black-deep p-8">
          <h3 className="text-lg font-bold text-white uppercase mb-4">How Tokens Work</h3>
          <div className="space-y-3 text-sm text-white-muted">
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">01</span>
              <p>Each brand audit costs tokens based on the number of brands analyzed. More brands = more API calls = more tokens.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">02</span>
              <p>Subscription plans include monthly token grants that refresh every billing cycle. Unused tokens roll over.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">03</span>
              <p>Need more? Purchase tokens through AIDEN Hub at aiden.services/pricing.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-accent font-bold font-geist-mono w-8 flex-shrink-0">04</span>
              <p>Tokens cover real costs: Facebook Ad Library scraping, logo analysis, AI-powered strategic intelligence, and more.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
