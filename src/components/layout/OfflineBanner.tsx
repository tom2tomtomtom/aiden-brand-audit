"use client";

import { useState, useEffect } from "react";

/**
 * OfflineBanner - BUG-BA-008
 * Persistent banner when the browser loses network connectivity.
 * Uses navigator.onLine + window online/offline events.
 * Only rendered on the client; SSR-safe (defaults to online state).
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initialise from current state (handles hard reload while offline)
    setIsOffline(!navigator.onLine);

    function handleOffline() { setIsOffline(true); }
    function handleOnline() { setIsOffline(false); }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full bg-black-card border-b-2 border-red-hot px-4 py-2 text-center text-xs text-red-hot font-bold uppercase tracking-wide"
    >
      You are offline. Audits require an internet connection.
    </div>
  );
}
