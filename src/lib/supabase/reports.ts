import { createServiceClient } from "./server";
import type { AuditResults } from "@/lib/types";

export async function saveReport(results: AuditResults): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    const { error } = await supabase.from("reports").insert({
      id: results.id,
      brands: results.brands.map((b) => b.name),
      results: results as unknown as Record<string, unknown>,
      duration: results.duration,
      created_at: results.createdAt,
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
