import { createServiceClient } from "./server";
import type { AuditResults } from "@/lib/types";

function sanitizeForJson(obj: unknown): unknown {
  const raw = JSON.stringify(obj);
  const clean = raw
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return JSON.parse(clean);
}

export async function saveReport(results: AuditResults, userId?: string): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    const cleanResults = sanitizeForJson(results) as Record<string, unknown>;
    const { error } = await supabase.from("reports").insert({
      id: results.id,
      brands: results.brands.map((b) => b.name),
      results: cleanResults,
      duration: results.duration,
      created_at: results.createdAt,
      ...(userId && { user_id: userId }),
    });

    if (error) {
      console.error("[reports] Save failed:", error.message);
      return null;
    }

    return results.id;
  } catch (e) {
    console.error("[reports] Save error:", e);
    return null;
  }
}

export async function loadReport(id: string): Promise<AuditResults | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("results")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data.results as unknown as AuditResults;
  } catch {
    return null;
  }
}

export async function listReports(): Promise<
  { id: string; brands: string[]; created_at: string; duration: number }[]
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("id, brands, created_at, duration")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
