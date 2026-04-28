"use client";

import { useState, useEffect, useRef } from "react";
import { Coins, ChevronDown, ExternalLink } from "lucide-react";

interface TokenData {
  balance: number;
  plan: string;
  monthlyGrant: number;
  estimatedCosts: {
    twoBrands: number;
    threeBrands: number;
    perBrand: number;
    analysis: number;
  };
}

export function TokenBalanceBadge() {
  const [data, setData] = useState<TokenData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tokens").then((r) => r.ok ? r.json() : null).then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Render even when data hasn't arrived yet (show a placeholder) so the
  // header doesn't flash a missing slot, and so an API/env misconfig
  // surfaces as a placeholder rather than a silent zero. Previous versions hid the
  // pill entirely when the fetch returned nothing, which looked like a
  // legitimate 0-token state to users.
  const balance = data?.balance ?? null;
  const costs = data?.estimatedCosts ?? { twoBrands: 0, threeBrands: 0, perBrand: 0, analysis: 0 };
  const isUnknown = balance === null;
  const isLow = !isUnknown && balance < costs.twoBrands;
  const isHealthy = !isUnknown && balance >= costs.threeBrands;

  const colorClass = isUnknown
    ? "border-border-subtle text-white-dim hover:bg-white/5"
    : isLow
    ? "border-red-hot text-red-hot hover:bg-red-hot/10"
    : isHealthy
      ? "border-green-500 text-green-500 hover:bg-green-500/10"
      : "border-orange-accent text-orange-accent hover:bg-orange-accent/10";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all ${colorClass}`}
      >
        <Coins className="h-3.5 w-3.5" />
        <span className="font-geist-mono tabular-nums">{isUnknown ? "?" : balance}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-black-deep border-2 border-border-subtle z-50">
          <div className="p-4 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white-dim uppercase tracking-wide">Token Balance</span>
              <span className={`text-lg font-bold font-geist-mono tabular-nums ${isUnknown ? "text-white-dim" : isLow ? "text-red-hot" : isHealthy ? "text-green-500" : "text-orange-accent"}`}>
                {isUnknown ? "?" : balance}
              </span>
            </div>
            {isUnknown && (
              <p className="text-[10px] text-white-dim mt-1">
                Balance unavailable. Check AIDEN Hub.
              </p>
            )}
            {!isUnknown && data && data.monthlyGrant > 0 && (
              <p className="text-[10px] text-white-dim font-geist-mono">
                +{data.monthlyGrant} tokens/month ({data.plan} plan)
              </p>
            )}
            {isLow && (
              <p className="text-[10px] text-red-hot mt-1 font-bold uppercase">
                Low balance. Get tokens from AIDEN Hub.
              </p>
            )}
          </div>

          <div className="p-4 border-b border-border-subtle">
            <p className="text-[10px] text-white-dim uppercase tracking-wide mb-2">Audit Cost</p>
            <div className="space-y-1 text-xs text-white-muted font-geist-mono">
              <div className="flex justify-between">
                <span>2 brands</span>
                <span className="text-orange-accent">{costs.twoBrands} tokens</span>
              </div>
              <div className="flex justify-between">
                <span>3 brands</span>
                <span className="text-orange-accent">{costs.threeBrands} tokens</span>
              </div>
              <div className="flex justify-between text-white-dim">
                <span>Per extra brand</span>
                <span>+{costs.perBrand}</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <a
              href="https://www.aiden.services/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-black-card border border-border-subtle hover:border-orange-accent transition-all text-xs text-orange-accent font-bold uppercase tracking-wide"
            >
              <ExternalLink className="h-3 w-3" />
              Get Tokens
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
