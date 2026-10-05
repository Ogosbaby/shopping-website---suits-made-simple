"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogoMark } from "@/components/Logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const isAppMode = searchParams.get("from") === "app";

  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** App mode: whether to expand email form (collapsed by default) */
  const [showEmailForm, setShowEmailForm] = useState(false);

  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const next = searchParams.get("next");
  const targetPath =
    next && next.startsWith("/") && next !== "/login"
      ? next
      : isAppMode
      ? "/"
      : "/account";

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingSession(false);
      // In app mode, skip the "you're already signed in" screen and go straight to the store.
      if (data.user && isAppMode) {
        router.replace(targetPath);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Fold any guest cart into the account, then continue to the destination. */
  async function afterSignIn() {
    try {
      await fetch("/api/auth/migrate", { method: "POST" });
    } catch {
      // Recoverable — the cart route adopts guest lines on read.
    }
    router.push(targetPath);
    router.refresh();
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Authentication is not configured yet.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setMessage("Those passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setMessage("Passwords must be at least 8 characters.");
      return;
    }

    setSigningIn(true);
    setMessage(null);
    setNotice(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setSigningIn(false);
        setMessage(error.message);
        return;
      }

      await afterSignIn();
      return;
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", targetPath);

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { emailRedirectTo: callbackUrl.toString() },
    });

    if (error) {
      setSigningIn(false);
      setMessage(error.message);
      return;
    }

    setSigningIn(false);

    if (data.session) {
      await afterSignIn();
      return;
    }

    setMode("signin");
    setNotice("Account created. Check your email to confirm, then sign in.");
  }

  async function handleGoogleSignIn() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Authentication is not configured yet.");
      return;
    }

    setSigningIn(true);
    setMessage(null);
    setNotice(null);

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

  /* ── App-mode (Jumia-style full-screen mobile UI) ─────────────────────── */
  if (isAppMode) {
    return (
      <div
        className="fixed inset-0 flex flex-col"
        style={{ background: "linear-gradient(160deg,#212832 0%,#3b4654 100%)" }}
      >
        {/* Status bar safe area */}
        <div style={{ paddingTop: "env(safe-area-inset-top)" }} />

        {/* ── Header area ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-7 pb-4 pt-10">
          {/* Logo mark */}
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.08]">
            <LogoMark className="h-11 w-11 text-white" />
          </div>

          {/* Brand name */}
          <p
            className="mt-2 text-center text-white/55"
            style={{ fontFamily: "var(--font-inter)", fontSize: "0.52rem", letterSpacing: "0.36em", textTransform: "uppercase" }}
          >
            Suits Made Simple
          </p>

          {/* Heading */}
          <h1
            className="mt-8 text-center text-2xl leading-tight text-white"
            style={{ fontFamily: "var(--font-cinzel)", letterSpacing: "0.04em" }}
          >
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-center text-sm text-white/55">
            {mode === "signup"
              ? "Join and sync your cart across every device."
              : "Sign in to continue shopping."}
          </p>

          {/* Error / notice banners */}
          {authError === "config" ? (
            <p className="mt-5 rounded border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-300">
              Authentication is not configured yet.
            </p>
          ) : authError === "auth" ? (
            <p className="mt-5 rounded border border-red-400/40 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              We could not complete that sign-in. Please try again.
            </p>
          ) : null}

          {message ? (
            <p className="mt-5 w-full rounded border border-red-400/40 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              {message}
            </p>
          ) : null}

          {notice ? (
            <p className="mt-5 w-full rounded border border-white/30 bg-white/10 px-4 py-3 text-xs text-white/80">
              {notice}
            </p>
          ) : null}

          {checkingSession ? (
            <div className="mt-10 h-14 w-full animate-pulse rounded-lg bg-white/10" />
          ) : user ? (
            /* Already signed in — redirect fires automatically via useEffect */
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-sm text-white/60">Heading to the store…</p>
            </div>
          ) : (
            <div className="mt-10 w-full space-y-3">
              {/* ── Google sign-in (primary CTA) ── */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={signingIn || !configured}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-white py-4 text-sm font-semibold text-gray-800 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {/* Google logo */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.8Z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.29v3.09A12 12 0 0 0 12 24Z"/>
                  <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.99-3.09Z"/>
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"/>
                </svg>
                Continue with Google
              </button>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/20" />
                <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/40">or</span>
                <span className="h-px flex-1 bg-white/20" />
              </div>

              {/* ── Email toggle / form ── */}
              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/[0.07] py-4 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="m3 7 9 7 9-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  </svg>
                  {mode === "signup" ? "Register with email" : "Sign in with email"}
                </button>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {/* Mode switcher */}
                  <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/20">
                    {(["signin", "signup"] as Mode[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setMode(opt); setMessage(null); setNotice(null); }}
                        className={`py-3 text-xs font-semibold uppercase tracking-widest transition-colors ${
                          mode === opt ? "bg-white text-brand" : "bg-transparent text-white/60"
                        }`}
                        aria-pressed={mode === opt}
                      >
                        {opt === "signin" ? "Sign in" : "Register"}
                      </button>
                    ))}
                  </div>

                  <input
                    id="app-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full rounded-lg border border-white/20 bg-white/[0.08] px-4 py-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                  />

                  <input
                    id="app-password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (8+ characters)"
                    minLength={8}
                    required
                    className="w-full rounded-lg border border-white/20 bg-white/[0.08] px-4 py-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                  />

                  {mode === "signup" ? (
                    <input
                      id="app-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      minLength={8}
                      required
                      className="w-full rounded-lg border border-white/20 bg-white/[0.08] px-4 py-4 text-sm text-white placeholder:text-white/35 focus:border-white/50 focus:outline-none"
                    />
                  ) : null}

                  <button
                    type="submit"
                    disabled={signingIn || !configured}
                    className="w-full rounded-lg bg-brand py-4 text-sm font-semibold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {signingIn ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-center text-xs text-white/40 underline underline-offset-2"
                  >
                    Back
                  </button>
                </form>
              )}

              {/* Guest / Direct Shop Access */}
              <div className="pt-2 text-center">
                <Link
                  href="/?from=app"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                >
                  Explore store as guest
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-7 pb-8 text-center" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          <p className="text-xs leading-relaxed text-white/30">
            By continuing you agree to our{" "}
            <span className="text-white/50 underline underline-offset-2">terms</span>
            {" "}and{" "}
            <span className="text-white/50 underline underline-offset-2">privacy policy</span>.
          </p>
        </div>
      </div>
    );
  }

  /* ── Web mode (original card layout, unchanged) ──────────────────────── */
  return (
    <div className="shell flex justify-center py-12 sm:py-24">
      <div className="w-full max-w-md border border-line bg-white p-7 shadow-card sm:p-11">
        <div className="text-center">
          <LogoMark className="mx-auto h-11 w-11 text-brand" />
          <p className="label-caps mt-6">Suits Made Simple</p>
          <h1 className="mt-3 font-display text-2xl text-ink sm:text-3xl">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-brand-light">
            Sign in to track your orders, keep your measurements and sync your cart across every device.
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

        {notice ? (
          <p className="mt-7 border border-brand/30 bg-brand/[0.05] px-4 py-3 text-sm text-brand">{notice}</p>
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
            <>
              {/* Mode switch */}
              <div className="grid grid-cols-2 border border-line">
                {(["signin", "signup"] as Mode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setMode(option);
                      setMessage(null);
                      setNotice(null);
                    }}
                    className={`py-3 text-[0.68rem] font-semibold uppercase tracking-brand transition-colors ${
                      mode === option ? "bg-brand text-white" : "bg-white text-brand-light hover:text-ink"
                    }`}
                    aria-pressed={mode === option}
                  >
                    {option === "signin" ? "Sign in" : "Register"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="field-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>

                {mode === "signup" ? (
                  <div>
                    <label htmlFor="confirm-password" className="field-label">
                      Confirm password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="input"
                      placeholder="Repeat your password"
                      minLength={8}
                      required
                    />
                  </div>
                ) : null}

                <button type="submit" disabled={signingIn || !configured} className="btn-primary w-full">
                  {signingIn
                    ? "Please wait…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[0.6rem] font-semibold uppercase tracking-brand text-brand-soft">
                  or
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={signingIn || !configured}
                className="btn-outline w-full"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.8Z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.29v3.09A12 12 0 0 0 12 24Z"/>
                  <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.29a12 12 0 0 0 0 10.74l3.99-3.09Z"/>
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        <p className="mt-7 text-center text-xs leading-relaxed text-brand-soft">
          By continuing you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
