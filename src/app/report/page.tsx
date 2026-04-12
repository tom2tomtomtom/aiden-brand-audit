"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Clock } from "lucide-react";
import type { AuditResults } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { BrandCards } from "@/components/report/BrandCards";
import { VisualDna } from "@/components/report/VisualDna";
import { AdGallery } from "@/components/report/AdGallery";
import { StrategicAnalysis } from "@/components/report/StrategicAnalysis";
import { CompetitiveMatrix } from "@/components/report/CompetitiveMatrix";

export default function ReportPage() {
  const router = useRouter();
  const [results, setResults] = useState<AuditResults | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const stored = sessionStorage.getItem("auditResults");
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      router.push("/");
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
    { id: "strategy", label: "Strategic Analysis" },
    { id: "matrix", label: "Competitive Matrix" },
  ];

  return (
    <div className="min-h-screen bg-black-ink">
      {/* Header */}
      <header className="border-b-2 border-red-hot bg-black-deep sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="text-white-muted hover:text-red-hot transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-red-hot uppercase tracking-tight">
                Brand DNA Report
              </h1>
              <div className="flex items-center gap-1 text-xs text-white-dim font-geist-mono">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(results.duration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white-dim uppercase tracking-wide">
                {results.brands.length} brands analyzed
              </span>
              <button className="flex items-center gap-2 bg-red-hot text-white px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all">
                <Download className="h-3 w-3" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Section Nav */}
      <nav className="border-b border-border-subtle bg-black-deep/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${
                  activeSection === section.id
                    ? "text-red-hot border-red-hot"
                    : "text-white-dim border-transparent hover:text-white-muted"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
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
          {activeSection === "strategy" && <StrategicAnalysis analysis={results.strategicAnalysis} brands={results.brands} />}
          {activeSection === "matrix" && <CompetitiveMatrix analysis={results.strategicAnalysis} brands={results.brands} />}
        </div>
      </main>

      {/* Footer */}
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
