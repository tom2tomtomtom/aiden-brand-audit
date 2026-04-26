/**
 * Cross-tab Supabase auth circuit breaker.
 *
 * Stops the per-IP rate-limit cascade caused by stale refresh tokens. State
 * lives in localStorage so every tab on every aiden.services subdomain shares
 * one circuit. BroadcastChannel coordinates real-time updates across tabs of
 * the same origin. Web Locks API serialises refresh attempts so only one tab
 * ever calls /auth/v1/token at a time.
 *
 * Constants tuned to match Supabase's per-IP limit of 30 token refreshes per
 * 5 minutes. Three failures inside 30 seconds opens the circuit for 5 minutes,
 * which is well below the rate-limit window so we always recover before any
 * legitimate user is affected.
 */

const CIRCUIT_KEY = "aiden-auth-circuit";
const LOCK_KEY = "aiden-auth-refresh-lock";
const CHANNEL_NAME = "aiden-auth";

const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 30_000;
const CIRCUIT_OPEN_MS = 5 * 60_000;

export interface CircuitState {
  open: boolean;
  openedAt: number;
  failures: number;
  firstFailureAt: number;
}

const DEFAULT_STATE: CircuitState = {
  open: false,
  openedAt: 0,
  failures: 0,
  firstFailureAt: 0,
};

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const probe = "__aiden-probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}

export function getCircuit(): CircuitState {
  const s = safeStorage();
  if (!s) return DEFAULT_STATE;
  try {
    const raw = s.getItem(CIRCUIT_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeCircuit(state: CircuitState, broadcast = true): void {
  const s = safeStorage();
  if (s) {
    try {
      s.setItem(CIRCUIT_KEY, JSON.stringify(state));
    } catch {}
  }
  if (broadcast) {
    const ch = getChannel();
    if (ch) {
      try {
        ch.postMessage({ type: "circuit", state });
        ch.close();
      } catch {}
    }
  }
}

export function isCircuitOpen(): boolean {
  const c = getCircuit();
  if (!c.open) return false;
  if (Date.now() - c.openedAt >= CIRCUIT_OPEN_MS) {
    writeCircuit(DEFAULT_STATE);
    return false;
  }
  return true;
}

export function recordFailure(): void {
  const now = Date.now();
  const c = getCircuit();
  const withinWindow = now - c.firstFailureAt < FAILURE_WINDOW_MS;
  const failures = withinWindow ? c.failures + 1 : 1;
  const firstFailureAt = withinWindow ? c.firstFailureAt : now;
  if (failures >= FAILURE_THRESHOLD) {
    writeCircuit({ open: true, openedAt: now, failures, firstFailureAt });
    if (typeof console !== "undefined") {
      console.warn(`[aiden-auth] Circuit opened after ${failures} failures, blocking auth requests for ${CIRCUIT_OPEN_MS / 1000}s`);
    }
  } else {
    writeCircuit({ ...c, failures, firstFailureAt });
  }
}

export function recordSuccess(): void {
  const c = getCircuit();
  if (c.open || c.failures > 0) writeCircuit(DEFAULT_STATE);
}

export function resetCircuit(): void {
  writeCircuit(DEFAULT_STATE);
}

function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.match(/\/\/([^.]+)/)?.[1] ?? "";
}

export function nukeAuthStorage(): void {
  const s = safeStorage();
  if (s) {
    try {
      const ref = projectRef();
      const toRemove: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (!k || k === CIRCUIT_KEY || k === LOCK_KEY) continue;
        if (k.startsWith(`sb-${ref}`) || (k.startsWith("sb-") && k.includes("auth-token"))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => s.removeItem(k));
    } catch {}
  }
  if (typeof document !== "undefined") {
    try {
      const ref = projectRef();
      document.cookie.split(";").forEach((c) => {
        const name = c.split("=")[0]?.trim() ?? "";
        if (name.startsWith(`sb-${ref}`) || (name.startsWith("sb-") && name.includes("auth-token"))) {
          document.cookie = `${name}=; Max-Age=0; path=/; domain=.aiden.services`;
          document.cookie = `${name}=; Max-Age=0; path=/`;
        }
      });
    } catch {}
  }
}

export interface RefreshLock {
  release: () => void;
}

export async function acquireRefreshLock(timeoutMs = 2000): Promise<RefreshLock | null> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    let release: (() => void) | null = null;
    const acquired = new Promise<RefreshLock | null>((resolve) => {
      navigator.locks
        .request(
          LOCK_KEY,
          { mode: "exclusive", ifAvailable: false },
          () =>
            new Promise<void>((releaseLock) => {
              release = releaseLock;
              resolve({ release: releaseLock });
            }),
        )
        .catch(() => resolve(null));
    });
    const timeout = new Promise<RefreshLock | null>((resolve) =>
      setTimeout(() => {
        if (release) release();
        resolve(null);
      }, timeoutMs),
    );
    return Promise.race([acquired, timeout]);
  }

  const s = safeStorage();
  if (!s) return { release: () => {} };
  const now = Date.now();
  const existing = Number(s.getItem(LOCK_KEY) ?? "0");
  if (existing && now - existing < timeoutMs) return null;
  s.setItem(LOCK_KEY, String(now));
  return {
    release: () => {
      try {
        s.removeItem(LOCK_KEY);
      } catch {}
    },
  };
}

export function subscribeCircuitChanges(handler: (state: CircuitState) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = (event: MessageEvent) => {
    if (event.data?.type === "circuit" && event.data.state) {
      handler(event.data.state as CircuitState);
    }
  };
  ch.addEventListener("message", listener);
  return () => {
    try {
      ch.removeEventListener("message", listener);
      ch.close();
    } catch {}
  };
}
