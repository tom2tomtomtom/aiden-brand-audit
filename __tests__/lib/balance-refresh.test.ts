import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  AIDEN_BALANCE_REFRESH_EVENT,
  AIDEN_BALANCE_STORAGE_KEY,
  announceBalanceChange,
  balanceRefreshModeFromEvent,
  balanceRefreshModeForReason,
  balanceRefreshModeFromStorage,
} from "@/lib/balance-events";

describe("shared balance refresh", () => {
  it.each([
    ["audit-complete", "once"],
    ["insufficient-tokens", "once"],
    ["payment-return", "reconcile"],
    ["audit-uncertain", "reconcile"],
  ] as const)("maps %s to a %s refresh", (reason, expectedMode) => {
    expect(balanceRefreshModeForReason(reason)).toBe(expectedMode);
  });

  it("preserves reconciliation mode across same-page and storage events", () => {
    const event = new CustomEvent(AIDEN_BALANCE_REFRESH_EVENT, {
      detail: { mode: "reconcile" },
    });

    expect(balanceRefreshModeFromEvent(event)).toBe("reconcile");
    expect(balanceRefreshModeFromStorage("reconcile:payment-1")).toBe("reconcile");
    expect(balanceRefreshModeFromStorage("legacy-marker")).toBe("once");
  });

  it("notifies the current page and other tabs with the requested mode", () => {
    const dispatchEvent = vi.fn();
    const setItem = vi.fn();

    announceBalanceChange({
      dispatchEvent,
      localStorage: { setItem },
    }, "payment-return", "payment-1");

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AIDEN_BALANCE_REFRESH_EVENT,
        detail: { mode: "reconcile" },
      }),
    );
    expect(setItem).toHaveBeenCalledWith(
      AIDEN_BALANCE_STORAGE_KEY,
      "reconcile:payment-1",
    );
  });

  it("still refreshes the current page when storage is unavailable", () => {
    const dispatchEvent = vi.fn();

    expect(() => announceBalanceChange({
      dispatchEvent,
      localStorage: {
        setItem() {
          throw new Error("storage blocked");
        },
      },
    }, "audit-uncertain", "audit-1")).not.toThrow();

    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it("wires the nav to bounded reconciliation and ordinary refresh triggers", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/AppNav.tsx"),
      "utf8",
    );

    expect(source).toContain("AIDEN_BALANCE_REFRESH_EVENT");
    expect(source).toContain("AIDEN_BALANCE_STORAGE_KEY");
    expect(source).toContain("createBalanceRefresher");
    expect(source).toContain("balanceRefreshModeFromEvent");
    expect(source).toContain("balanceRefreshModeFromStorage");
    expect(source).toContain("visibilitychange");
    expect(source).toContain("window.addEventListener('focus'");
    expect(source).toContain("window.addEventListener('storage'");
    expect(source).toContain("cache: 'no-store'");
    expect(source).toContain("refresher.refreshOnce()");
    expect(source).toContain("refresher.reconcile()");
    expect(source).toContain("refresher.dispose()");
  });

  it("uses explicit refresh reasons for payment returns and audit outcomes", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/dashboard/page.tsx"),
      "utf8",
    );

    expect(source.match(/announceBalanceChange\(window, "payment-return"\)/g)).toHaveLength(2);
    expect(source).toContain('announceBalanceChange(window, "insufficient-tokens")');
    expect(source).toContain('announceBalanceChange(window, "audit-complete")');
    expect(source).toContain('announceBalanceChange(window, "audit-uncertain")');
    expect(source).toContain("Payment received. Your account is updating.");
    expect(source).toContain("Payment received. Your token balance is updating.");
    expect(source).not.toContain("Tokens added to your balance!");
  });
});
