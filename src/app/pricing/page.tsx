"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanKey } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try it out",
    features: [
      "2 audits per month",
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
    name: "Starter",
    price: "$49",
    period: "one-time",
    description: "10 audits, never expires",
    features: [
      "10 audits (lifetime)",
      "2-5 brands per audit",
      "Ad Library scraping",
      "Color DNA extraction",
      "Full AIDEN strategic analysis",
      "Brand Intel (PR, press, campaigns)",
      "PDF export",
      "Shareable report links",
    ],
    cta: "Buy Starter",
    href: null,
    highlight: false,
    plan: "starter" as PlanKey,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For active teams",
    features: [
      "Unlimited audits",
      "2-5 brands per audit",
      "Ad Library scraping",
      "Color DNA extraction",
      "Full AIDEN strategic analysis",
      "Brand Intel (PR, press, campaigns)",
      "Ad analytics dashboard",
      "PDF export",
      "Shareable report links",
      "Priority support",
    ],
    cta: "Subscribe",
    href: null,
    highlight: true,
    plan: "pro" as PlanKey,
  },
  {
    name: "Agency",
    price: "$499",
    period: "/month",
    description: "For agencies and large teams",
    features: [
      "Everything in Pro",
      "White-label reports",
      "Bulk audit API access",
      "Team seats (coming soon)",
      "Dedicated support",
      "Custom phantom brains",
    ],
    cta: "Contact us",
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
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session.");
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
                BRAND DNA // ANALYZER
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Link href="/dashboard" className="bg-red-hot px-4 py-2 text-sm font-bold text-white hover:bg-red-dim transition-colors uppercase tracking-wide">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-white-muted hover:text-white transition-colors uppercase tracking-wide">
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-red-hot px-4 py-2 text-sm font-bold text-white hover:bg-red-dim transition-colors uppercase tracking-wide"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-red-hot uppercase tracking-tight">
            Simple Pricing
          </h2>
          <p className="mt-4 text-lg text-white-muted uppercase tracking-wide">
            Start free. Pay when you need more.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && (
                  <span className="ml-1 text-sm text-white-dim">{tier.period}</span>
                )}
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
                    className={`block w-full px-4 py-3 text-center text-sm font-bold uppercase tracking-wide transition-colors ${
                      tier.highlight
                        ? "bg-red-hot text-white hover:bg-red-dim border-2 border-red-hot"
                        : "border-2 border-border-subtle text-white hover:bg-white/5"
                    }`}
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
      </section>
    </div>
  );
}
