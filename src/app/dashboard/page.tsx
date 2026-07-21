"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, X, Zap, Eye, BarChart3, Brain, Search, CheckCircle, Clock, FileText, ArrowRight, XCircle, Link2Off, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { BrandConfig, ProgressEvent } from "@/lib/types";
import { estimateAuditCost } from "@/lib/tokens";
import {
  AUDIT_CANCELLATION_MESSAGE,
  getAuditActivityLabel,
  getAuditStatusMessage,
  readAuditEventStream,
} from "@/lib/audit-stream";
import {
  canRemoveBrand,
  createInitialBrands,
  formatBrandCount,
  getFacebookConfirmationError,
  removeBrandAt,
  updateBrandField,
  updateFacebookPageQuery,
} from "@/lib/brand-form";
import { CompanySearchRequestGate } from "@/lib/company-search";
import { announceBalanceChange } from "@/lib/balance-events";

interface ReportSummary {
  id: string;
  brands: string[];
  created_at: string;
  duration: number;
  revoked_at?: string | null;
  share_expires_at?: string | null;
}

function getShareStatus(report: ReportSummary): "active" | "revoked" | "expired" {
  if (report.revoked_at) return "revoked";
  if (report.share_expires_at && Date.now() > new Date(report.share_expires_at).getTime()) {
    return "expired";
  }
  return "active";
}

interface CompanyResult {
  page_id: string;
  name: string;
  page_alias: string;
  category: string;
  likes: number;
  image_uri: string;
}

function CompanySearch({ brand, index, onSelect, onQueryChange }: {
  brand: BrandConfig;
  index: number;
  onSelect: (index: number, company: CompanyResult) => void;
  onQueryChange: (index: number, value: string) => void;
}) {
  const [query, setQuery] = useState(brand.facebookPage || "");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef(query);
  const requestGateRef = useRef<CompanySearchRequestGate | null>(null);
  if (!requestGateRef.current) requestGateRef.current = new CompanySearchRequestGate();
  const inputId = `fb-search-${index}`;
  const listboxId = `fb-listbox-${index}`;

  useEffect(() => {
    const nextQuery = brand.facebookPage || "";
    if (nextQuery === queryRef.current) return;
    queryRef.current = nextQuery;
    requestGateRef.current?.invalidate();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(nextQuery);
    setResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    setIsSearching(false);
    setSearchCompleted(false);
  }, [brand.facebookPage]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestGateRef.current?.invalidate();
    };
  }, []);

  function handleSearch(value: string) {
    queryRef.current = value;
    setQuery(value);
    onQueryChange(index, value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setShowDropdown(false);
    setSearchCompleted(false);
    if (value.length < 2) {
      requestGateRef.current?.invalidate();
      setIsSearching(false);
      return;
    }

    const request = requestGateRef.current!.begin();

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/companies?q=${encodeURIComponent(value)}`, {
          signal: request.signal,
        });
        const data = await res.json();
        if (!request.isCurrent()) return;
        setResults(data.results || []);
        setShowDropdown(true);
        setSearchCompleted(true);
      } catch {
        if (request.isCurrent()) {
          setResults([]);
          setShowDropdown(false);
          setSearchCompleted(true);
        }
      } finally {
        if (request.isCurrent()) setIsSearching(false);
      }
    }, 400);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectCompany(results[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }

  function selectCompany(company: CompanyResult) {
    requestGateRef.current?.invalidate();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    queryRef.current = company.name;
    onSelect(index, company);
    setQuery(company.name);
    setResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    setIsSearching(false);
    setSearchCompleted(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1"
      >
        Facebook Page <span className="text-white-dim/70 normal-case">(confirm before audit)</span>
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Facebook pages..."
          className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 hover:border-border-strong focus:border-red-hot focus:bg-black-deep transition-all pr-8"
        />
        {isSearching && <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-white-dim" aria-hidden="true" />}
        {!isSearching && brand.facebookPageId && <CheckCircle className="absolute right-3 top-3.5 h-4 w-4 text-orange-accent" aria-hidden="true" />}
        {!isSearching && !brand.facebookPageId && query.length >= 2 && <Search className="absolute right-3 top-3.5 h-4 w-4 text-white-dim" aria-hidden="true" />}
      </div>

      {showDropdown && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Facebook page suggestions"
          className="absolute z-50 w-full mt-1 bg-black-deep border-2 border-red-hot max-h-60 overflow-auto list-none"
        >
          {results.map((company, i) => (
            <li
              key={company.page_id}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`w-full px-4 py-3 text-left transition-colors border-b border-border-subtle last:border-0 flex items-center gap-3 cursor-pointer ${i === activeIndex ? "bg-black-card" : "hover:bg-black-card"}`}
              onMouseDown={(e) => {
                // Prevent blur on the input before click registers
                e.preventDefault();
                selectCompany(company);
              }}
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
            </li>
          ))}
        </ul>
      )}
      {searchCompleted && !isSearching && results.length === 0 && !brand.facebookPageId && (
        <p role="status" className="mt-2 text-[10px] text-orange-accent font-geist-mono">
          No Facebook Pages found. Try the exact Meta Page name before starting the audit.
        </p>
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
  const [brands, setBrands] = useState<BrandConfig[]>(createInitialBrands);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressIndeterminate, setProgressIndeterminate] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [finalizationStarted, setFinalizationStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [progressDetail, setProgressDetail] = useState("");
  const [pastReports, setPastReports] = useState<ReportSummary[]>([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLoading, setReportsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Payment received. Your account is updating.");
      announceBalanceChange(window, "payment-return");
    }
    if (searchParams.get("topup") === "success") {
      toast.success("Payment received. Your token balance is updating.");
      announceBalanceChange(window, "payment-return");
    }
  }, [searchParams]);

  useEffect(() => {
    loadReports(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReports(page: number) {
    setReportsLoading(true);
    try {
      const res = await fetch(`/api/reports?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        // Support both old array format and new paginated format
        if (Array.isArray(data)) {
          setPastReports(data);
          setReportsTotal(data.length);
        } else {
          setPastReports(data.reports ?? []);
          setReportsTotal(data.total ?? 0);
        }
        setReportsPage(page);
      }
    } catch { /* non-critical */ }
    setReportsLoading(false);
  }

  async function deleteReport(id: string) {
    try {
      const res = await fetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Report deleted");
        await loadReports(reportsPage);
      } else {
        toast.error("Failed to delete report");
      }
    } catch {
      toast.error("Failed to delete report");
    }
  }

  async function setShareRevoked(id: string, revoke: boolean) {
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: revoke ? "revoke" : "unrevoke" }),
      });
      if (res.ok) {
        toast.success(revoke ? "Share link revoked" : "Share link restored");
        await loadReports(reportsPage);
      } else {
        toast.error("Failed to update share link");
      }
    } catch {
      toast.error("Failed to update share link");
    }
  }

  function addBrand() {
    if (brands.length >= 5) { toast.error("Maximum 5 brands per audit"); return; }
    setBrands([...brands, { name: "", website: "" }]);
  }

  function removeBrand(index: number) {
    if (!canRemoveBrand(brands.length)) { toast.error("At least one brand is required"); return; }
    setBrands(removeBrandAt(brands, index));
  }

  function updateBrand(index: number, field: keyof BrandConfig, value: string) {
    setBrands(updateBrandField(brands, index, field, value));
  }

  function updateFacebookPage(index: number, value: string) {
    setBrands(updateFacebookPageQuery(brands, index, value));
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
    const hasAnyInput = brands.some((b) => b.name.trim() || b.website.trim());
    if (!hasAnyInput) {
      toast.error("Enter a brand name and website to start an audit");
      return;
    }

    const incompleteBrands = brands.filter((b) => b.name.trim() && !b.website.trim());
    if (incompleteBrands.length > 0) {
      toast.error(`Add a website for ${incompleteBrands[0].name}`);
      return;
    }

    // UXA-20260717 F-025: a single-brand audit is valid (per-brand pricing).
    // The backend accepts min 1; the old 2-brand floor blocked it needlessly.
    const validBrands = brands.filter((b) => b.name.trim() && b.website.trim());
    if (validBrands.length < 1) {
      toast.error("Enter at least one brand with a name and website");
      return;
    }

    const confirmationError = getFacebookConfirmationError(validBrands);
    if (confirmationError) {
      toast.error(confirmationError);
      return;
    }

    // Pre-pay warning: a brand with no ads in the Meta Ad Library is still
    // billed the full per-brand cost. Surface it so the user can back out
    // before paying. Best-effort: a failed check never blocks the audit.
    try {
      const checkRes = await fetch("/api/companies/ads-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brands: validBrands.map((b) => ({
            name: b.name,
            website: b.website,
            facebookPageId: b.facebookPageId,
          })),
        }),
      });
      if (checkRes.ok) {
        const { noAds } = await checkRes.json();
        if (Array.isArray(noAds) && noAds.length > 0) {
          const perBrand = estimateAuditCost(1).perBrand;
          const many = noAds.length > 1;
          const proceed = window.confirm(
            `No ads found in the Meta Ad Library for: ${noAds.join(", ")}.\n\n` +
              `${many ? "These brands" : "This brand"} will still cost ${perBrand} tokens` +
              `${many ? " each" : ""} with little to show in Ad Intelligence.\n\n` +
              `OK to run the audit anyway, or Cancel to go back and remove ` +
              `${many ? "them" : "it"}.`,
          );
          if (!proceed) return;
        }
      }
    } catch {
      /* Pre-check is advisory only; never block the audit on its failure. */
    }

    setIsAnalyzing(true);
    setProgress(0);
    setProgressIndeterminate(false);
    setCancelRequested(false);
    setFinalizationStarted(false);
    setCurrentStep("Initializing audit...");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands: validBrands }),
        signal: abortController.signal,
      });

      if (response.status === 402) {
        const errData = await response.json().catch(() => null);
        let msg = "Insufficient tokens. Top up your balance.";
        if (errData?.tokenCost != null && errData?.balance != null) {
          const topUp = errData.tokenCost - errData.balance;
          msg = `Need ${errData.tokenCost}, have ${errData.balance}. Top up ${topUp} token${topUp !== 1 ? "s" : ""} to continue.`;
        }
        toast.error(msg);
        announceBalanceChange(window, "insufficient-tokens");
        setIsAnalyzing(false);
        return;
      }

      if (!response.ok || !response.body) throw new Error("Failed to start audit");

      function handleEvent(event: ProgressEvent) {
        if (event.type === "progress") {
          setProgress(Math.min(event.progress, 100));
          setProgressIndeterminate(event.indeterminate === true);
          if (event.cancellable === false) setFinalizationStarted(true);
          setCurrentStep(event.step);
          setProgressDetail(event.detail || "");
        } else if (event.type === "complete") {
          setProgress(100);
          setProgressIndeterminate(false);
          setCurrentStep("Complete");
          sessionStorage.setItem("auditResults", JSON.stringify(event.results));
          announceBalanceChange(window, "audit-complete");
          toast.success("Brand DNA analysis complete");
          router.push("/report");
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      await readAuditEventStream(response.body, handleEvent);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.info(AUDIT_CANCELLATION_MESSAGE);
      } else {
        toast.error(error instanceof Error ? error.message : "Audit failed");
      }
      announceBalanceChange(window, "audit-uncertain");
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  }

  function cancelAudit() {
    setCancelRequested(true);
    abortControllerRef.current?.abort();
  }

  const auditStatusMessage = getAuditStatusMessage(finalizationStarted, cancelRequested);

  return (
    <div className="min-h-screen bg-black-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { icon: Eye, label: "Ad Library Scraping" },
            { icon: Zap, label: "Color DNA Extraction" },
            { icon: Brain, label: "AIDEN Strategic Analysis" },
            { icon: BarChart3, label: "Ad Analytics Dashboard" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 px-4 py-2 bg-black-card border border-border-subtle select-none cursor-default">
              <Icon className="h-4 w-4 text-orange-accent" />
              <span className="text-xs text-white-dim uppercase tracking-wide font-normal">{label}</span>
            </span>
          ))}
        </div>

        {!isAnalyzing ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-black-deep border-2 border-border-subtle p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-orange-accent uppercase">
                  New Audit
                </h3>
              </div>

              <div className="space-y-6">
                {brands.map((brand, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`brand-name-${i}`}
                            className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1"
                          >
                            Brand Name
                          </label>
                          <input
                            id={`brand-name-${i}`}
                            type="text"
                            value={brand.name}
                            onChange={(e) => updateBrand(i, "name", e.target.value)}
                            placeholder="e.g. Aesop"
                            className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 hover:border-border-strong focus:border-red-hot focus:bg-black-deep transition-all"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`brand-website-${i}`}
                            className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1"
                          >
                            Website
                          </label>
                          <input
                            id={`brand-website-${i}`}
                            type="url"
                            value={brand.website}
                            onChange={(e) => updateBrand(i, "website", e.target.value)}
                            placeholder="e.g. https://aesop.com"
                            className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 hover:border-border-strong focus:border-red-hot focus:bg-black-deep transition-all"
                          />
                        </div>
                      </div>
                      <CompanySearch
                        brand={brand}
                        index={i}
                        onSelect={selectCompany}
                        onQueryChange={updateFacebookPage}
                      />
                      {brand.facebookPageId && (
                        <p className="text-[10px] text-orange-accent font-geist-mono">
                          Confirmed: {brand.facebookPage} · Page ID {brand.facebookPageId}
                        </p>
                      )}
                    </div>
                    {canRemoveBrand(brands.length) && (
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

              {brands.filter(b => b.name.trim()).length === 0 && (
                <p className="mt-4 text-[10px] text-white-dim font-geist-mono uppercase tracking-wide">
                  Audit one brand, or add more to compare them against each other.
                </p>
              )}

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-subtle">
                <button
                  onClick={addBrand}
                  className="flex items-center gap-2 text-white-muted hover:text-orange-accent text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Brand
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white-dim font-geist-mono">
                    ~{estimateAuditCost(
                      Math.max(1, brands.filter(b => b.name.trim()).length)
                    ).total} tokens
                  </span>
                  <button
                    onClick={startAudit}
                    className="bg-red-hot text-white px-8 py-3 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Analyze Brand DNA
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-black-deep border-2 border-red-hot p-8">
              <h3 className="text-xl font-bold text-red-hot uppercase mb-6">
                Analyzing Brand DNA
              </h3>
              <div
                role="status"
                aria-live="polite"
                aria-label={progressIndeterminate
                  ? `Audit in progress. ${currentStep}`
                  : `Audit progress: ${Math.min(Math.round(progress), 100)}%. ${currentStep}`}
                className="mb-6"
              >
                <div className="flex justify-between text-xs text-white-dim uppercase tracking-wide mb-2">
                  <span>{currentStep}</span>
                  <span className="tabular-nums font-geist-mono">
                    {progressIndeterminate ? "In progress" : `${Math.min(Math.round(progress), 100)}%`}
                  </span>
                </div>
                <div className="h-2 bg-black-card border border-border-subtle overflow-hidden">
                  {progressIndeterminate ? (
                    <div className="h-full w-full bg-red-hot/40 motion-safe:animate-pulse" />
                  ) : (
                    <div
                      className="h-full bg-red-hot motion-safe:transition-all motion-safe:duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  )}
                </div>
                {progressDetail && (
                  <p className="text-xs text-white-dim mt-2 font-geist-mono">{progressDetail}</p>
                )}
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-red-hot" aria-hidden="true" />
                <span className="text-sm text-white-muted">
                  {getAuditActivityLabel(progress, finalizationStarted)}
                </span>
              </div>
              <div className="mt-6 flex justify-center">
                {!finalizationStarted && !cancelRequested ? (
                  <button
                    onClick={cancelAudit}
                    className="flex items-center gap-2 text-white-dim hover:text-red-hot text-xs font-bold uppercase tracking-wide transition-colors border border-border-subtle px-4 py-2 hover:border-red-hot"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Audit
                  </button>
                ) : (
                  <p className="text-xs text-white-dim text-center font-geist-mono">
                    {auditStatusMessage}
                  </p>
                )}
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
              {reportsTotal} report{reportsTotal !== 1 ? "s" : ""}
            </span>
          </div>

          {reportsLoading ? (
            <div className="bg-black-deep border-2 border-border-subtle p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-white-dim" aria-hidden="true" />
            </div>
          ) : pastReports.length === 0 ? (
            <div className="bg-black-deep border-2 border-border-subtle p-8 text-center">
              <p className="text-sm text-white-dim">No reports yet. Run your first audit above.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pastReports.map((report) => {
                  const shareStatus = getShareStatus(report);
                  const isRevoked = !!report.revoked_at;
                  return (
                  <div
                    key={report.id}
                    className="flex items-center gap-2 bg-black-deep border-2 border-border-subtle hover:border-red-hot transition-all group"
                  >
                    <Link
                      href={`/report/${report.id}`}
                      className="flex-1 flex items-center justify-between p-4 min-w-0"
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
                            {formatBrandCount(report.brands.length)}
                          </span>
                          {shareStatus !== "active" && (
                            <span className="text-[10px] text-red-hot font-geist-mono uppercase tracking-wide border border-red-hot px-1.5 py-0.5">
                              {shareStatus === "revoked" ? "Link revoked" : "Link expired"}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white-dim group-hover:text-red-hot transition-colors flex-shrink-0 mr-2" />
                    </Link>
                    <button
                      onClick={() => setShareRevoked(report.id, !isRevoked)}
                      aria-label={
                        isRevoked
                          ? `Restore share link: ${report.brands.join(" vs ")}`
                          : `Revoke share link: ${report.brands.join(" vs ")}`
                      }
                      title={isRevoked ? "Restore share link" : "Revoke share link"}
                      className="flex-shrink-0 p-4 text-white-dim hover:text-red-hot transition-colors border-l border-border-subtle"
                    >
                      {isRevoked ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this report? This cannot be undone.")) {
                          deleteReport(report.id);
                        }
                      }}
                      aria-label={`Delete report: ${report.brands.join(" vs ")}`}
                      className="flex-shrink-0 p-4 text-white-dim hover:text-red-hot transition-colors border-l border-border-subtle"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  );
                })}
              </div>

              {reportsTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => loadReports(reportsPage - 1)}
                    disabled={reportsPage <= 1}
                    className="text-xs font-bold uppercase tracking-wide text-white-dim hover:text-red-hot disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-white-dim font-geist-mono">
                    Page {reportsPage} of {Math.ceil(reportsTotal / PAGE_SIZE)}
                  </span>
                  <button
                    onClick={() => loadReports(reportsPage + 1)}
                    disabled={reportsPage >= Math.ceil(reportsTotal / PAGE_SIZE)}
                    className="text-xs font-bold uppercase tracking-wide text-white-dim hover:text-red-hot disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
