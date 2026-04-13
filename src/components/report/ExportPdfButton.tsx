"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AuditResults } from "@/lib/types";

export function ExportPdfButton({ results }: { results: AuditResults }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "brand-dna-report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 bg-red-hot text-white px-2 sm:px-4 py-2 text-xs font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all disabled:opacity-50"
    >
      {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      <span className="hidden sm:inline">{exporting ? "Generating..." : "Export PDF"}</span>
    </button>
  );
}
