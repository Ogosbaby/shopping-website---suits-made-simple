"use client";

import { useIsApp } from "@/lib/useIsApp";
import { Footer } from "@/components/Footer";

export function AppFooter() {
  const isApp = useIsApp();

  // In the native app the BottomNav handles navigation — no web footer.
  if (isApp) return null;

  // On the web (desktop + tablet + mobile browser) show the full footer.
  return <Footer />;
}
