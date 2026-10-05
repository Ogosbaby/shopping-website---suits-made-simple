"use client";

/**
 * ViewMoreGate
 *
 * Renders a gradient fade-out + a floating "View More" button over the bottom
 * of the featured product grid on the home page.
 *
 * Behaviour on click:
 * - If the visitor is already signed in  → navigates to /shop
 * - If the visitor is a guest           → opens a minimal modal prompting
 *   Google sign-in; on success Supabase redirects them back to /shop
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ViewMoreGate() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [showModal, setShowModal] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setUser(null); return; }

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Close modal on outside click
  useEffect(() => {
    if (!showModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowModal(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  function handleViewMore() {
    if (user) {
      router.push("/shop");
    } else {
      setShowModal(true);
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setSigningIn(true);
    setError(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/shop");

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: { prompt: "select_account" },
      },
    });

    if (oauthError) {
      setSigningIn(false);
      setError(oauthError.message);
    }
    // On success the browser is redirected by Supabase — no cleanup needed
  }

  return (
    <>
      {/* Gradient fade + floating button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-52 flex-col items-center justify-end pb-8"
        style={{
          background: "linear-gradient(to top, rgb(var(--color-bg-paper)) 30%, transparent)"
        }}
      >
        <button
          type="button"
          onClick={handleViewMore}
          className="pointer-events-auto group relative inline-flex items-center gap-2.5 overflow-hidden border border-brand bg-brand px-8 py-3.5 text-xs font-semibold uppercase tracking-brand text-white shadow-lift transition-all duration-300 hover:bg-brand-dark active:scale-95 dark:border-amber-500 dark:bg-amber-600 dark:text-gray-950 dark:hover:bg-amber-500"
          aria-label="View more suits in the full collection"
        >
          {/* Shine sweep animation */}
          <span
            className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden="true"
          />

          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path
              d="M4 6h16M4 10h10M4 14h6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M17 14l4 4m0 0l-4 4m4-4H13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          View the full collection
        </button>
      </div>

      {/* Sign-in modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-deeper/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-modal-title"
        >
          <div
            ref={modalRef}
            className="relative mx-4 w-full max-w-sm border border-line bg-surface p-8 shadow-lift"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-brand-soft transition-colors hover:text-ink"
              aria-label="Close sign-in prompt"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            {/* Logo mark */}
            <div className="mb-6 flex items-center gap-3">
              <svg viewBox="0 0 100 100" fill="none" className="h-9 w-9 shrink-0 text-ink" aria-hidden="true">
                <path d="M38 17 L14 25 L30 42 L44 33 Z" fill="currentColor" />
                <path d="M62 17 L86 25 L70 42 L56 33 Z" fill="currentColor" />
                <path d="M50 22 L56.5 28.5 L50 35 L43.5 28.5 Z" fill="currentColor" />
                <path d="M45.5 31.5 L54.5 31.5 L58 62 L50 74 L42 62 Z" fill="currentColor" />
                <circle cx="50" cy="82" r="3" fill="currentColor" />
              </svg>
              <div>
                <p id="signin-modal-title" className="font-display text-lg font-semibold text-ink">
                  Unlock the full collection
                </p>
                <p className="text-xs text-brand-light">Sign in to browse all suits</p>
              </div>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-brand-light">
              Create a free account or sign in with Google to browse our complete range of premium corporate and casual suits.
            </p>

            {error && (
              <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-3 border border-line bg-surface py-3.5 text-sm font-semibold text-ink shadow-sm transition-all hover:border-brand hover:shadow-card active:scale-[0.98] disabled:opacity-60"
            >
              {signingIn ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-spin text-brand" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 56" />
                </svg>
              ) : (
                /* Google colour logo mark */
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {signingIn ? "Redirecting to Google…" : "Continue with Google"}
            </button>

            <p className="mt-5 text-center text-[0.65rem] leading-relaxed text-brand-soft">
              By continuing you agree to our{" "}
              <a href="#" className="underline hover:text-ink">Terms</a> and{" "}
              <a href="#" className="underline hover:text-ink">Privacy Policy</a>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
