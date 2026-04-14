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

  if (!data) return null;

  const isLow = data.balance < data.estimatedCosts.twoBrands;
  const isHealthy = data.balance >= data.estimatedCosts.threeBrands;

  const colorClass = isLow
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
        <span className="font-geist-mono tabular-nums">{data.balance}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-black-deep border-2 border-border-subtle z-50">
          <div className="p-4 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white-dim uppercase tracking-wide">Token Balance</span>
              <span className={`text-lg font-bold font-geist-mono tabular-nums ${isLow ? "text-red-hot" : isHealthy ? "text-green-500" : "text-orange-accent"}`}>
                {data.balance}
              </span>
            </div>
            {data.monthlyGrant > 0 && (
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
                <span className="text-orange-accent">{data.estimatedCosts.twoBrands} tokens</span>
              </div>
              <div className="flex justify-between">
                <span>3 brands</span>
                <span className="text-orange-accent">{data.estimatedCosts.threeBrands} tokens</span>
              </div>
              <div className="flex justify-between text-white-dim">
                <span>Per extra brand</span>
                <span>+{data.estimatedCosts.perBrand}</span>
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
