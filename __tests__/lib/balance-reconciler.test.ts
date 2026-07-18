import { afterEach, describe, expect, it, vi } from "vitest";
import { createBalanceRefresher } from "@/lib/balance-refresh";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("balance refresher", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("eventually adopts a balance that changes after delayed settlement", async () => {
    vi.useFakeTimers();
    const loadBalance = vi.fn()
      .mockResolvedValueOnce({ balance: 100 })
      .mockResolvedValueOnce({ balance: 100 })
      .mockResolvedValueOnce({ balance: 150 });
    const applyBalance = vi.fn();
    const refresher = createBalanceRefresher({ loadBalance, applyBalance });

    refresher.reconcile();
    await vi.advanceTimersByTimeAsync(3_000);

    expect(loadBalance).toHaveBeenCalledTimes(3);
    expect(applyBalance).toHaveBeenLastCalledWith({ balance: 150 });
  });

  it("does not let an older response overwrite a newer balance", async () => {
    vi.useFakeTimers();
    const older = deferred<{ balance: number }>();
    const newer = deferred<{ balance: number }>();
    const loadBalance = vi.fn()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const applyBalance = vi.fn();
    const refresher = createBalanceRefresher({ loadBalance, applyBalance });

    refresher.reconcile();
    await vi.advanceTimersByTimeAsync(1_000);
    newer.resolve({ balance: 40 });
    await newer.promise;
    older.resolve({ balance: 100 });
    await older.promise;

    expect(applyBalance).toHaveBeenCalledOnce();
    expect(applyBalance).toHaveBeenLastCalledWith({ balance: 40 });
  });

  it("stops scheduled retries and ignores pending work after disposal", async () => {
    vi.useFakeTimers();
    const pending = deferred<{ balance: number }>();
    const loadBalance = vi.fn().mockReturnValue(pending.promise);
    const applyBalance = vi.fn();
    const refresher = createBalanceRefresher({ loadBalance, applyBalance });

    refresher.reconcile();
    expect(loadBalance).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(4);

    refresher.dispose();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(20_000);
    pending.resolve({ balance: 75 });
    await pending.promise;

    expect(loadBalance).toHaveBeenCalledOnce();
    expect(applyBalance).not.toHaveBeenCalled();
  });

  it("restarts one bounded retry window when another reconciliation arrives", () => {
    vi.useFakeTimers();
    const refresher = createBalanceRefresher({
      loadBalance: vi.fn().mockResolvedValue({ balance: 100 }),
      applyBalance: vi.fn(),
    });

    refresher.reconcile();
    expect(vi.getTimerCount()).toBe(4);
    refresher.reconcile();

    expect(vi.getTimerCount()).toBe(4);
  });

  it("performs one request without scheduling retries for an ordinary refresh", async () => {
    vi.useFakeTimers();
    const loadBalance = vi.fn().mockResolvedValue({ balance: 80 });
    const applyBalance = vi.fn();
    const refresher = createBalanceRefresher({ loadBalance, applyBalance });

    refresher.refreshOnce();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(loadBalance).toHaveBeenCalledOnce();
    expect(applyBalance).toHaveBeenCalledWith({ balance: 80 });
    expect(vi.getTimerCount()).toBe(0);
  });
});
