import { describe, expect, it } from "vitest";
import { CompanySearchRequestGate } from "@/lib/company-search";

describe("CompanySearchRequestGate", () => {
  it("invalidates and aborts an older request when a new query starts", () => {
    const gate = new CompanySearchRequestGate();
    const first = gate.begin();
    const second = gate.begin();

    expect(first.signal.aborted).toBe(true);
    expect(first.isCurrent()).toBe(false);
    expect(second.signal.aborted).toBe(false);
    expect(second.isCurrent()).toBe(true);
  });

  it("invalidates the active request when the brand identity changes", () => {
    const gate = new CompanySearchRequestGate();
    const active = gate.begin();

    gate.invalidate();

    expect(active.signal.aborted).toBe(true);
    expect(active.isCurrent()).toBe(false);
  });
});
