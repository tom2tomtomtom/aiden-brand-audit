"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { AuditResults } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { ExportPdfButton } from "@/components/report/ExportPdfButton";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { BrandCards } from "@/components/report/BrandCards";
import { VisualDna } from "@/components/report/VisualDna";
import { AdGallery } from "@/components/report/AdGallery";
import { AdAnalytics } from "@/components/report/AdAnalytics";
import { BrandIntel } from "@/components/report/BrandIntel";
import { StrategicAnalysis } from "@/components/report/StrategicAnalysis";
import { CompetitiveMatrix } from "@/components/report/CompetitiveMatrix";
import { SocialSentiment } from "@/components/report/SocialSentiment";

export default function ReportPage() {
  const router = useRouter();
  const [results, setResults] = useState<AuditResults | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const stored = sessionStorage.getItem("auditResults");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.brands)) {
        throw new Error("Invalid audit payload");
      }
      setResults(parsed);
    } catch (err) {
      console.error("[report] Corrupt sessionStorage payload:", err);
      sessionStorage.removeItem("auditResults");
      router.push("/dashboard");
    }
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen bg-black-ink flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-red-hot border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white-muted text-sm uppercase tracking-wide">Loading report...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "visual", label: "Visual DNA" },
    { id: "ads", label: "Ad Intelligence" },
    { id: "analytics", label: "Analytics" },
    { id: "intel", label: "Brand Intel" },
    { id: "social", label: "Social Pulse" },
    { id: "strategy", label: "Strategic Analysis" },
    { id: "matrix", label: "Competitive Matrix" },
  ];

  return (
    <div className="min-h-screen bg-black-ink">
      {!results.id && (
        <div
          role="alert"
          className="w-full bg-black-card border-b-2 border-orange-accent px-4 py-2 text-center text-xs text-orange-accent font-bold uppercase tracking-wide"
        >
          Audit could not be saved. Re-run to retain history.
        </div>
      )}
      <header className="border-b-2 border-red-hot bg-black-deep sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => router.push("/")}
                className="text-white-muted hover:text-red-hot transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-sm sm:text-lg font-bold text-red-hot uppercase tracking-tight truncate">
                Brand DNA Report
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-xs text-white-dim font-geist-mono flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(results.duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="hidden sm:inline text-xs text-white-dim uppercase tracking-wide">
                {results.brands.length} brands analyzed
              </span>
              {results.id && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/report/${results.id}`);
                    toast.success("Share link copied");
                  }}
                  className="flex items-center gap-2 bg-black-card text-white-muted px-2 sm:px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-border-subtle hover:border-orange-accent transition-all"
                >
                  <Share2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
              <ExportPdfButton results={results} />
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border-subtle bg-black-deep/80 backdrop-blur-sm sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap ${
                    activeSection === section.id
                      ? "text-red-hot border-red-hot"
                      : "text-white-dim border-transparent hover:text-white-muted"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black-deep to-transparent pointer-events-none sm:hidden" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          {activeSection === "overview" && (
            <div className="space-y-8">
              <ExecutiveSummary analysis={results.strategicAnalysis} />
              <BrandCards brands={results.brands} />
            </div>
          )}
          {activeSection === "visual" && <VisualDna brands={results.brands} analysis={results.strategicAnalysis} />}
          {activeSection === "ads" && <AdGallery brands={results.brands} />}
          {activeSection === "analytics" && <AdAnalytics brands={results.brands} />}
          {activeSection === "intel" && <BrandIntel brands={results.brands} />}
          {activeSection === "social" && <SocialSentiment brands={results.brands} />}
          {activeSection === "strategy" && <StrategicAnalysis analysis={results.strategicAnalysis} brands={results.brands} />}
          {activeSection === "matrix" && <CompetitiveMatrix analysis={results.strategicAnalysis} brands={results.brands} />}
        </div>
      </main>

      <footer className="border-t-2 border-red-hot bg-black-deep mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-white-dim uppercase tracking-wide">
            Brand DNA Analyzer // Powered by AIDEN &amp; Redbaez
          </p>
        </div>
      </footer>
    </div>
  );
}
