"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, Zap, Eye, BarChart3, Brain } from "lucide-react";
import { toast } from "sonner";
import type { BrandConfig, ProgressEvent, AuditResults } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandConfig[]>([
    { name: "", website: "" },
    { name: "", website: "" },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [progressDetail, setProgressDetail] = useState("");

  function addBrand() {
    if (brands.length >= 5) {
      toast.error("Maximum 5 brands per audit");
      return;
    }
    setBrands([...brands, { name: "", website: "" }]);
  }

  function removeBrand(index: number) {
    if (brands.length <= 2) {
      toast.error("Minimum 2 brands required");
      return;
    }
    setBrands(brands.filter((_, i) => i !== index));
  }

  function updateBrand(index: number, field: keyof BrandConfig, value: string) {
    const updated = [...brands];
    updated[index] = { ...updated[index], [field]: value };
    setBrands(updated);
  }

  async function startAudit() {
    const validBrands = brands.filter((b) => b.name.trim() && b.website.trim());
    if (validBrands.length < 2) {
      toast.error("Enter at least 2 brands with names and websites");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStep("Initializing audit...");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands: validBrands }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start audit");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: ProgressEvent = JSON.parse(line.slice(6));

            if (event.type === "progress") {
              setProgress(event.progress);
              setCurrentStep(event.step);
              setProgressDetail(event.detail || "");
            } else if (event.type === "complete") {
              setProgress(100);
              setCurrentStep("Complete");
              // Store results and navigate
              sessionStorage.setItem("auditResults", JSON.stringify(event.results));
              toast.success("Brand DNA analysis complete");
              router.push("/report");
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Audit failed");
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-black-ink">
      {/* Header */}
      <header className="border-b-2 border-red-hot bg-black-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-red-hot uppercase tracking-tight">
              BRAND DNA // ANALYZER
            </h1>
            <span className="text-xs text-white-dim uppercase tracking-wide font-geist-mono">
              Powered by AIDEN
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-7xl font-bold tracking-tight text-red-hot uppercase">
            Competitive Brand<br />Intelligence
          </h2>
          <p className="mt-6 text-lg text-white-muted max-w-3xl mx-auto uppercase tracking-wide">
            Scrape real ad data. Extract visual DNA. Get strategic analysis.
          </p>
          <p className="mt-4 text-base text-white-dim max-w-2xl mx-auto">
            AIDEN&apos;s phantom brain system analyzes Facebook Ad Library data,
            extracts color DNA, and delivers competitive intelligence in seconds.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {[
            { icon: Eye, label: "Ad Library Scraping" },
            { icon: Zap, label: "Color DNA Extraction" },
            { icon: Brain, label: "AIDEN Strategic Analysis" },
            { icon: BarChart3, label: "Competitive Matrix" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 bg-black-card border border-border-subtle"
            >
              <Icon className="h-4 w-4 text-orange-accent" />
              <span className="text-xs text-white-muted uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Brand Input Form */}
        {!isAnalyzing ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-black-deep border-2 border-border-subtle p-8">
              <h3 className="text-xl font-bold text-orange-accent uppercase mb-6">
                Enter Brands to Analyze
              </h3>

              <div className="space-y-4">
                {brands.map((brand, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1">
                            Brand Name
                          </label>
                          <input
                            type="text"
                            value={brand.name}
                            onChange={(e) => updateBrand(i, "name", e.target.value)}
                            placeholder="e.g. Nike"
                            className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 hover:border-border-strong focus:border-red-hot focus:bg-black-deep transition-all"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1">
                            Website
                          </label>
                          <input
                            type="url"
                            value={brand.website}
                            onChange={(e) => updateBrand(i, "website", e.target.value)}
                            placeholder="e.g. https://nike.com"
                            className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 hover:border-border-strong focus:border-red-hot focus:bg-black-deep transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    {brands.length > 2 && (
                      <button
                        onClick={() => removeBrand(i)}
                        className="mt-6 p-2 text-white-dim hover:text-red-hot transition-colors"
                        aria-label="Remove brand"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-subtle">
                <button
                  onClick={addBrand}
                  className="flex items-center gap-2 text-white-muted hover:text-orange-accent text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Brand
                </button>

                <button
                  onClick={startAudit}
                  className="bg-red-hot text-white px-8 py-3 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all"
                >
                  Analyze Brand DNA
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-white-dim mt-4 uppercase tracking-wide">
              Powered by ScrapeCreators + AIDEN API // Typically completes in 30-60 seconds
            </p>
          </div>
        ) : (
          /* Progress View */
          <div className="max-w-2xl mx-auto">
            <div className="bg-black-deep border-2 border-red-hot p-8">
              <h3 className="text-xl font-bold text-red-hot uppercase mb-6">
                Analyzing Brand DNA
              </h3>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-white-dim uppercase tracking-wide mb-2">
                  <span>{currentStep}</span>
                  <span className="tabular-nums font-geist-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-black-card border border-border-subtle">
                  <div
                    className="h-full bg-red-hot transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progressDetail && (
                  <p className="text-xs text-white-dim mt-2 font-geist-mono">{progressDetail}</p>
                )}
              </div>

              {/* Animated dots */}
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-red-hot" />
                <span className="text-sm text-white-muted">
                  {progress < 80 ? "Collecting intelligence..." : "AIDEN analyzing..."}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-red-hot bg-black-deep mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-white-dim uppercase tracking-wide">
            Brand DNA Analyzer // Powered by AIDEN &amp; Redbaez
          </p>
        </div>
      </footer>
    </div>
  );
}
