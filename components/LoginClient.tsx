"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogoMark } from "@/components/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginClient() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingSession(false);
    });
  }, []);

  const next = searchParams.get("next");
  const targetPath = next && next.startsWith("/") && next !== "/login" ? next : "/account";

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Authentication is not configured yet.");
      return;
    }

    setSigningIn(true);
    setMessage(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", targetPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setSigningIn(false);
      setMessage(error.message);
    }
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div className="shell flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-md border border-line bg-white p-9 shadow-card sm:p-11">
        <div className="text-center">
          <LogoMark className="mx-auto h-11 w-11 text-brand" />
          <p className="label-caps mt-6">Suits Made Simple</p>
          <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">Sign in</h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-brand-light">
            Sign in with Google to track your orders and check out faster.
          </p>
        </div>

        {authError === "config" ? (
          <p className="mt-7 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Authentication is not configured yet. Add your Supabase keys to <code>.env.local</code>.
          </p>
        ) : authError === "auth" ? (
          <p className="mt-7 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            We could not complete that sign-in. Please try again.
          </p>
        ) : null}

        {message ? (
          <p className="mt-7 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
        ) : null}

        <div className="mt-8">
          {checkingSession ? (
            <div className="h-12 animate-pulse bg-mist" />
          ) : user ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-brand-light">
                Signed in as <span className="font-medium text-ink">{user.email}</span>
              </p>
              <Link href={targetPath} className="btn-primary w-full">
                {targetPath === "/checkout" ? "Continue to checkout" : "Go to your account"}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-[0.68rem] font-semibold uppercase tracking-brand text-brand-soft transition-colors hover:text-ink"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn || !configured}
              className="btn-outline w-full"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.8Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.29v3.09A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.99-3.09Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
                />
              </svg>
              {signingIn ? "Redirecting…" : "Continue with Google"}
            </button>
          )}
        </div>

        <p className="mt-7 text-center text-xs leading-relaxed text-brand-soft">
          By continuing you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
