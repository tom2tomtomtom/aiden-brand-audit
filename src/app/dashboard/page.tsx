"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, X, Zap, Eye, BarChart3, Brain, Search, CheckCircle, LogOut, CreditCard, Clock, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { BrandConfig, ProgressEvent } from "@/lib/types";
import type { PlanLimits } from "@/lib/usage";

interface ReportSummary {
  id: string;
  brands: string[];
  created_at: string;
  duration: number;
}

interface CompanyResult {
  page_id: string;
  name: string;
  page_alias: string;
  category: string;
  likes: number;
  image_uri: string;
}

function CompanySearch({ brand, index, onSelect }: {
  brand: BrandConfig;
  index: number;
  onSelect: (index: number, company: CompanyResult) => void;
}) {
  const [query, setQuery] = useState(brand.facebookPage || "");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setResults([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/companies?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1">
        Facebook Page <span className="text-white-dim/50 normal-case">(optional)</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search Facebook pages..."
          className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 hover:border-border-strong focus:border-red-hot focus:bg-black-deep transition-all pr-8"
        />
        {isSearching && <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-white-dim" />}
        {!isSearching && brand.facebookPageId && <CheckCircle className="absolute right-3 top-3.5 h-4 w-4 text-orange-accent" />}
        {!isSearching && !brand.facebookPageId && query.length >= 2 && <Search className="absolute right-3 top-3.5 h-4 w-4 text-white-dim" />}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-black-deep border-2 border-red-hot max-h-60 overflow-auto">
          {results.map((company) => (
            <button
              key={company.page_id}
              type="button"
              onClick={() => {
                onSelect(index, company);
                setQuery(company.name);
                setShowDropdown(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-black-card transition-colors border-b border-border-subtle last:border-0 flex items-center gap-3"
            >
              {company.image_uri && (
                <img src={company.image_uri} alt="" className="w-8 h-8 object-cover border border-border-subtle" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white-full font-bold truncate">{company.name}</p>
                <p className="text-[10px] text-white-dim uppercase tracking-wide">
                  {company.category} {company.likes > 0 && `· ${(company.likes / 1000).toFixed(0)}K likes`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UsageBadge({ planLimits }: { planLimits: PlanLimits | null }) {
  if (!planLimits) return null;

  const planColors: Record<string, string> = {
    free: "border-white-dim text-white-dim",
    starter: "border-orange-accent text-orange-accent",
    pro: "border-red-hot text-red-hot",
    agency: "border-yellow-electric text-yellow-electric",
  };

  return (
    <div className="flex items-center gap-4">
      <span className={`text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 ${planColors[planLimits.plan]}`}>
        {planLimits.plan}
      </span>
      {planLimits.limit !== null && (
        <span className="text-xs text-white-dim font-geist-mono">
          {planLimits.used}/{planLimits.limit} audits used
          {planLimits.resetType === "monthly" && " this month"}
        </span>
      )}
      {planLimits.limit === null && (
        <span className="text-xs text-white-dim font-geist-mono">Unlimited audits</span>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brands, setBrands] = useState<BrandConfig[]>([
    { name: "", website: "" },
    { name: "", website: "" },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [progressDetail, setProgressDetail] = useState("");
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pastReports, setPastReports] = useState<ReportSummary[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Payment successful! Your plan has been upgraded.");
    }
  }, [searchParams]);

  async function refreshData() {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserEmail(user.email ?? null);

    try {
      const res = await fetch("/api/user-plan");
      if (res.ok) setPlanLimits(await res.json());
    } catch { /* non-critical */ }

    try {
      const res = await fetch("/api/reports");
      if (res.ok) setPastReports(await res.json());
    } catch { /* non-critical */ }
    setReportsLoading(false);
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    function onFocus() { refreshData(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function addBrand() {
    if (brands.length >= 5) { toast.error("Maximum 5 brands per audit"); return; }
    setBrands([...brands, { name: "", website: "" }]);
  }

  function removeBrand(index: number) {
    if (brands.length <= 2) { toast.error("Minimum 2 brands required"); return; }
    setBrands(brands.filter((_, i) => i !== index));
  }

  function updateBrand(index: number, field: keyof BrandConfig, value: string) {
    const updated = [...brands];
    updated[index] = { ...updated[index], [field]: value };
    setBrands(updated);
  }

  function selectCompany(index: number, company: CompanyResult) {
    const updated = [...brands];
    updated[index] = {
      ...updated[index],
      facebookPage: company.name,
      facebookPageId: company.page_id,
    };
    if (!updated[index].name) updated[index].name = company.name;
    setBrands(updated);
  }

  async function startAudit() {
    if (planLimits && planLimits.limit !== null && planLimits.used >= planLimits.limit) {
      toast.error("Usage limit reached. Upgrade your plan for more audits.");
      router.push("/pricing");
      return;
    }

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

      if (response.status === 402) {
        toast.error("Usage limit reached. Upgrade your plan.");
        router.push("/pricing");
        setIsAnalyzing(false);
        return;
      }

      if (!response.ok || !response.body) throw new Error("Failed to start audit");

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
      <header className="border-b-2 border-red-hot bg-black-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold text-red-hot uppercase tracking-tight">
                BRAND DNA // ANALYZER
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <UsageBadge planLimits={planLimits} />
              <Link
                href="/pricing"
                className="flex items-center gap-1 text-xs text-orange-accent hover:text-red-hot transition-colors uppercase tracking-wide font-bold"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Upgrade
              </Link>
              {userEmail && (
                <span className="text-xs text-white-dim font-geist-mono hidden sm:inline">
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs text-white-dim hover:text-red-hot transition-colors uppercase tracking-wide"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { icon: Eye, label: "Ad Library Scraping" },
            { icon: Zap, label: "Color DNA Extraction" },
            { icon: Brain, label: "AIDEN Strategic Analysis" },
            { icon: BarChart3, label: "Ad Analytics Dashboard" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2 bg-black-card border border-border-subtle">
              <Icon className="h-4 w-4 text-orange-accent" />
              <span className="text-xs text-white-muted uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {!isAnalyzing ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-black-deep border-2 border-border-subtle p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-orange-accent uppercase">
                  New Audit
                </h3>
                {planLimits && planLimits.limit !== null && (
                  <span className="text-xs text-white-dim font-geist-mono">
                    {Math.max(0, planLimits.limit - planLimits.used)} audits remaining
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {brands.map((brand, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
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
                        <div>
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
                      <CompanySearch brand={brand} index={i} onSelect={selectCompany} />
                      {brand.facebookPageId && (
                        <p className="text-[10px] text-orange-accent font-geist-mono">
                          Verified: Page ID {brand.facebookPageId}
                        </p>
                      )}
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
                  disabled={planLimits !== null && planLimits.limit !== null && planLimits.used >= planLimits.limit}
                  className="bg-red-hot text-white px-8 py-3 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze Brand DNA
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-black-deep border-2 border-red-hot p-8">
              <h3 className="text-xl font-bold text-red-hot uppercase mb-6">
                Analyzing Brand DNA
              </h3>
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
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-red-hot" />
                <span className="text-sm text-white-muted">
                  {progress < 75 ? "Collecting intelligence..." : "AIDEN analyzing..."}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto mt-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-accent" />
              Past Reports
            </h3>
            <span className="text-xs text-white-dim font-geist-mono">
              {pastReports.length} report{pastReports.length !== 1 ? "s" : ""}
            </span>
          </div>

          {reportsLoading ? (
            <div className="bg-black-deep border-2 border-border-subtle p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white-dim" />
            </div>
          ) : pastReports.length === 0 ? (
            <div className="bg-black-deep border-2 border-border-subtle p-8 text-center">
              <p className="text-sm text-white-dim">No reports yet. Run your first audit above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/report/${report.id}`}
                  className="flex items-center justify-between bg-black-deep border-2 border-border-subtle p-4 hover:border-red-hot transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white-full group-hover:text-red-hot transition-colors truncate">
                      {report.brands.join(" vs ")}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-white-dim font-geist-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(report.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] text-white-dim font-geist-mono">
                        {Math.round(report.duration / 1000)}s
                      </span>
                      <span className="text-[10px] text-orange-accent font-geist-mono">
                        {report.brands.length} brands
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white-dim group-hover:text-red-hot transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
