import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  AIDEN_BALANCE_REFRESH_EVENT,
  AIDEN_BALANCE_STORAGE_KEY,
  announceBalanceChange,
} from "@/lib/balance-events";

describe("shared balance refresh", () => {
  it("notifies the current page and other tabs after billing settles", () => {
    const dispatchEvent = vi.fn();
    const setItem = vi.fn();

    announceBalanceChange({
      dispatchEvent,
      localStorage: { setItem },
    }, "settled-1");

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: AIDEN_BALANCE_REFRESH_EVENT }),
    );
    expect(setItem).toHaveBeenCalledWith(AIDEN_BALANCE_STORAGE_KEY, "settled-1");
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
    }, "settled-2")).not.toThrow();

    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it("wires the nav to authoritative refresh triggers with stale-response protection", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/AppNav.tsx"),
      "utf8",
    );

    expect(source).toContain("AIDEN_BALANCE_REFRESH_EVENT");
    expect(source).toContain("AIDEN_BALANCE_STORAGE_KEY");
    expect(source).toContain("visibilitychange");
    expect(source).toContain("window.addEventListener('focus'");
    expect(source).toContain("window.addEventListener('storage'");
    expect(source).toContain("cache: 'no-store'");
    expect(source).toContain("requestId !== latestRequestRef.current");
  });

  it("announces settlement after completion, failures, insufficient funds, and top-ups", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/dashboard/page.tsx"),
      "utf8",
    );
    const announcements = source.match(/announceBalanceChange\(window\)/g) ?? [];

    expect(announcements.length).toBeGreaterThanOrEqual(4);
  });
});
