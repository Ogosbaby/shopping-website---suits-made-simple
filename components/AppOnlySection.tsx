/**
 * AppOnlySection — renders its children only when running inside the Capacitor
 * native app shell (iOS / Android). On a regular browser (any viewport size)
 * it renders `null` and shows `webFallback` instead.
 *
 * During SSR / initial hydration both slots are hidden to avoid a flash;
 * once the effect fires the correct branch is revealed.
 */
"use client";

import { useIsApp } from "@/lib/useIsApp";

interface AppOnlySectionProps {
  /** Content shown exclusively inside the Capacitor app. */
  children: React.ReactNode;
  /** Content shown on the web (desktop, tablet and mobile browser). */
  webFallback?: React.ReactNode;
}

export function AppOnlySection({ children, webFallback }: AppOnlySectionProps) {
  const isApp = useIsApp();

  // `undefined` = not yet determined (SSR / first paint).
  // Render nothing during that window to avoid layout shift.
  if (isApp === undefined) return null;

  return isApp ? <>{children}</> : <>{webFallback ?? null}</>;
}
