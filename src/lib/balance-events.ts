export const AIDEN_BALANCE_REFRESH_EVENT = "aiden:balance-refresh";
export const AIDEN_BALANCE_STORAGE_KEY = "aiden:balance-refresh";

export type BalanceRefreshMode = "once" | "reconcile";
export type BalanceRefreshReason =
  | "audit-complete"
  | "insufficient-tokens"
  | "payment-return"
  | "audit-uncertain";

export function balanceRefreshModeForReason(
  reason: BalanceRefreshReason,
): BalanceRefreshMode {
  return reason === "payment-return" || reason === "audit-uncertain"
    ? "reconcile"
    : "once";
}

export function balanceRefreshModeFromEvent(event: Event): BalanceRefreshMode {
  return event instanceof CustomEvent && event.detail?.mode === "reconcile"
    ? "reconcile"
    : "once";
}

export function balanceRefreshModeFromStorage(value: string | null): BalanceRefreshMode {
  return value?.startsWith("reconcile:") ? "reconcile" : "once";
}

interface BalanceEventTarget {
  dispatchEvent(event: Event): unknown;
  localStorage?: {
    setItem(key: string, value: string): unknown;
  };
}

let refreshSequence = 0;

export function announceBalanceChange(
  target: BalanceEventTarget,
  reason: BalanceRefreshReason,
  marker = `${Date.now()}:${++refreshSequence}`,
): void {
  const mode = balanceRefreshModeForReason(reason);
  target.dispatchEvent(new CustomEvent(AIDEN_BALANCE_REFRESH_EVENT, {
    detail: { mode },
  }));
  try {
    target.localStorage?.setItem(AIDEN_BALANCE_STORAGE_KEY, `${mode}:${marker}`);
  } catch {
    // Storage can be disabled while same-page events still work.
  }
}
