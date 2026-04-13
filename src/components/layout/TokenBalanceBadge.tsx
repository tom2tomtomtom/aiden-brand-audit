"use client";

import { useState, useEffect, useRef } from "react";
import { Coins, Loader2, ChevronDown, Zap } from "lucide-react";
import { toast } from "sonner";

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

interface TokenPack {
  tokens: number;
  price: number;
  label: string;
}

export function TokenBalanceBadge() {
  const [data, setData] = useState<TokenData | null>(null);
  const [packs, setPacks] = useState<Record<string, TokenPack>>({});
  const [open, setOpen] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tokens").then((r) => r.ok ? r.json() : null).then(setData).catch(() => {});
    fetch("/api/tokens/topup").then((r) => r.ok ? r.json() : null).then((d) => d?.packs && setPacks(d.packs)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function buyPack(pack: string) {
    setBuying(pack);
    try {
      const res = await fetch("/api/tokens/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        toast.error(json.error || "Failed to create checkout");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBuying(null);
    }
  }

  if (!data) return null;

  const isLow = data.balance < data.estimatedCosts.twoBrands;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all ${
          isLow
            ? "border-red-hot text-red-hot hover:bg-red-hot/10"
            : "border-orange-accent text-orange-accent hover:bg-orange-accent/10"
        }`}
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
              <span className={`text-lg font-bold font-geist-mono tabular-nums ${isLow ? "text-red-hot" : "text-orange-accent"}`}>
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
                Low balance — top up to run audits
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
            <p className="text-[10px] text-white-dim uppercase tracking-wide mb-3">Top Up Tokens</p>
            <div className="space-y-2">
              {Object.entries(packs).map(([key, pack]) => (
                <button
                  key={key}
                  onClick={() => buyPack(key)}
                  disabled={buying === key}
                  className="w-full flex items-center justify-between px-3 py-2 bg-black-card border border-border-subtle hover:border-orange-accent transition-all text-xs disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-orange-accent" />
                    <span className="text-white-muted font-bold">{pack.label}</span>
                  </div>
                  <span className="text-white font-geist-mono">
                    {buying === key ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `$${(pack.price / 100).toFixed(0)}`
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
