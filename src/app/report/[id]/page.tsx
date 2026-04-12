"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { AuditResults } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { BrandCards } from "@/components/report/BrandCards";
import { VisualDna } from "@/components/report/VisualDna";
import { AdGallery } from "@/components/report/AdGallery";
import { AdAnalytics } from "@/components/report/AdAnalytics";
import { BrandIntel } from "@/components/report/BrandIntel";
import { SocialSentiment } from "@/components/report/SocialSentiment";
import { StrategicAnalysis } from "@/components/report/StrategicAnalysis";
import { CompetitiveMatrix } from "@/components/report/CompetitiveMatrix";

export default function SharedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [results, setResults] = useState<AuditResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) {
          setError("Report not found");
          return;
        }
        const data = await res.json();
        setResults(data);
      } catch {
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black-ink flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-red-hot border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white-muted text-sm uppercase tracking-wide">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-black-ink flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-hot text-lg font-bold uppercase mb-2">{error || "Report not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-orange-accent hover:text-red-hot uppercase tracking-wide"
          >
            Start New Audit
          </button>
        </div>
      </div>
    );
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied to clipboard");
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
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 bg-black-card text-white-muted px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-border-subtle hover:border-orange-accent transition-all"
              >
                <Share2 className="h-3 w-3" />
                Share
              </button>
              <button className="flex items-center gap-2 bg-red-hot text-white px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all">
                <Download className="h-3 w-3" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border-subtle bg-black-deep/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 whitespace-nowrap ${
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
          {activeSection === "strategy" && (
            <StrategicAnalysis analysis={results.strategicAnalysis} brands={results.brands} />
          )}
          {activeSection === "matrix" && (
            <CompetitiveMatrix analysis={results.strategicAnalysis} brands={results.brands} />
          )}
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
