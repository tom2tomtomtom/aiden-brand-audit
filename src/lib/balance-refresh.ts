export interface BalanceSnapshot {
  balance?: unknown;
  email?: unknown;
}

interface BalanceRefresherOptions {
  loadBalance(): Promise<BalanceSnapshot | null>;
  applyBalance(snapshot: BalanceSnapshot): void;
}

const RECONCILE_DELAYS_MS = [0, 1_000, 3_000, 7_000, 15_000] as const;

export function createBalanceRefresher({
  loadBalance,
  applyBalance,
}: BalanceRefresherOptions) {
  let latestRequestId = 0;
  let disposed = false;
  const retryTimers = new Set<ReturnType<typeof setTimeout>>();

  function clearRetryTimers() {
    for (const timer of retryTimers) clearTimeout(timer);
    retryTimers.clear();
  }

  async function refresh() {
    if (disposed) return;
    const requestId = ++latestRequestId;
    try {
      const snapshot = await loadBalance();
      if (!disposed && requestId === latestRequestId && snapshot) applyBalance(snapshot);
    } catch {
      // A later bounded attempt, focus, or visibility refresh can recover.
    }
  }

  return {
    refreshOnce() {
      void refresh();
    },
    reconcile() {
      if (disposed) return;
      clearRetryTimers();
      for (const delay of RECONCILE_DELAYS_MS) {
        if (delay === 0) {
          void refresh();
        } else {
          const timer = setTimeout(() => {
            retryTimers.delete(timer);
            void refresh();
          }, delay);
          retryTimers.add(timer);
        }
      }
    },
    dispose() {
      disposed = true;
      latestRequestId += 1;
      clearRetryTimers();
    },
  };
}
