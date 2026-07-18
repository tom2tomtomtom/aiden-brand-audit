export const AIDEN_BALANCE_REFRESH_EVENT = "aiden:balance-refresh";
export const AIDEN_BALANCE_STORAGE_KEY = "aiden:balance-refresh";

interface BalanceEventTarget {
  dispatchEvent(event: Event): unknown;
  localStorage?: {
    setItem(key: string, value: string): unknown;
  };
}

let refreshSequence = 0;

export function announceBalanceChange(
  target: BalanceEventTarget,
  marker = `${Date.now()}:${++refreshSequence}`,
): void {
  target.dispatchEvent(new Event(AIDEN_BALANCE_REFRESH_EVENT));
  try {
    target.localStorage?.setItem(AIDEN_BALANCE_STORAGE_KEY, marker);
  } catch {
    // Storage can be disabled while same-page events still work.
  }
}
