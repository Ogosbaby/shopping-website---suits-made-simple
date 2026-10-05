/**
 * useIsApp — detects whether the current session is running inside the
 * Capacitor native shell (Android / iOS) rather than a regular browser.
 *
 * Capacitor injects `window.Capacitor` at runtime, so this can only be
 * evaluated client-side (never during SSR/SSG).
 *
 * Returns `undefined` during SSR/hydration, then `true` or `false` once the
 * effect has run.  Components can treat `undefined` as "not yet known".
 */
"use client";

import { useEffect, useState } from "react";

export function useIsApp(): boolean | undefined {
  const [isApp, setIsApp] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    try {
      const hasCapacitor = !!(
        (window as unknown as { Capacitor?: unknown }).Capacitor
      );
      const isCapacitorUA = /capacitor|CapacitorApp/i.test(navigator.userAgent);
      const hasAppStorage = localStorage.getItem("sms_is_app") === "1";
      const hasAppParam =
        new URLSearchParams(window.location.search).get("from") === "app" ||
        new URLSearchParams(window.location.search).get("app") === "1";

      // Persist the flag so deep-linked pages also know they're in the app.
      if (hasAppParam) {
        localStorage.setItem("sms_is_app", "1");
        document.cookie = "sms_is_app=1; path=/; max-age=31536000; SameSite=Lax";
      }

      setIsApp(hasCapacitor || isCapacitorUA || hasAppStorage || hasAppParam);
    } catch {
      // Restricted contexts (e.g. private browsing with strict settings)
      setIsApp(false);
    }
  }, []);

  return isApp;
}
