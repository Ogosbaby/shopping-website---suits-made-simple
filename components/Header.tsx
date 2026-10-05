"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";
import { useCart } from "@/components/CartProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsApp } from "@/lib/useIsApp";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/fit-guide", label: "Fit Guide" },
  { href: "/#about", label: "About" },
];

export function Header() {
  const isApp = useIsApp();
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccountMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Keep the search field in step with the collection's own query string.
  // Read from the URL directly to avoid needing a Suspense boundary here.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(pathname === "/shop" ? current : "");
  }, [pathname]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur transition-colors duration-200"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* ── Jumia-style mobile top bar (logo + icons) ── */}
      <div className="shell flex h-14 items-center justify-between gap-3 md:h-20">
        {/* Logo — tagline hidden on mobile/tablet web, visible on desktop and always in app */}
        <Logo
          markClassName="h-8 w-8 md:h-9 md:w-9"
          wordClassName="text-base md:text-xl"
          taglineClassName={isApp ? "" : "hidden md:block"}
        />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.7rem] font-semibold uppercase tracking-brand text-brand-light transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right-side icons */}
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/checkout"
            className="hidden text-[0.7rem] font-semibold uppercase tracking-brand text-brand-light transition-colors hover:text-ink sm:inline"
          >
            Checkout
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            className="hidden text-[0.7rem] font-semibold uppercase tracking-brand text-brand-light transition-colors hover:text-ink sm:inline"
          >
            {user ? "Account" : "Sign in"}
          </Link>

          {/* Mobile icons — different for app vs web */}
          {isApp ? (
            /* App: account icon only (search is in the bar below) */
            <Link
              href={user ? "/account" : "/login"}
              className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand dark:hover:text-amber-400 md:hidden"
              aria-label={user ? "My account" : "Sign in"}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4.5 20c.7-3.7 3.8-6 7.5-6s6.8 2.3 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {user ? (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              ) : null}
            </Link>
          ) : (
            /* Web mobile: search icon + account dropdown */
            <>
              <Link
                href="/shop"
                className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand dark:hover:text-amber-400 md:hidden"
                aria-label="Search the collection"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </Link>

              {/* Account icon — dropdown when signed in, go to /login when signed out */}
              <div className="relative md:hidden">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAccountMenuOpen((o) => !o)}
                      className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand dark:hover:text-amber-400"
                      aria-label="Account menu"
                      aria-expanded={accountMenuOpen}
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                        <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M4.5 20c.7-3.7 3.8-6 7.5-6s6.8 2.3 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      {/* Green "signed in" dot */}
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    </button>

                    {/* Dropdown */}
                    {accountMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setAccountMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div className="absolute right-0 top-11 z-50 min-w-[160px] border border-line bg-surface shadow-lift">
                          <Link
                            href="/account"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-ink hover:bg-mist"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-brand-soft" aria-hidden="true">
                              <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M4.5 20c.7-3.7 3.8-6 7.5-6s6.8 2.3 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            My account
                          </Link>
                          <div className="border-t border-line" />
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
                              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand dark:hover:text-amber-400"
                    aria-label="Sign in"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M4.5 20c.7-3.7 3.8-6 7.5-6s6.8 2.3 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Theme mode toggle (Dark/Light) */}
          <ThemeToggle />

          {/* Cart icon (all screen sizes) */}
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand dark:hover:text-amber-400"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M3 3.5h2.2l2.2 11h11.4l2.2-7.5H6.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="19" r="1.6" fill="currentColor" />
              <circle cx="17" cy="19" r="1.6" fill="currentColor" />
            </svg>
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center bg-brand dark:bg-amber-500 px-1 text-[0.6rem] font-bold text-white dark:text-gray-950">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* ── Jumia-style search bar — app only ── */}
      {isApp ? (
        <div className="bg-paper border-t border-line/50 px-3 pb-3 pt-1 shadow-sm transition-colors">
          <form onSubmit={handleSearch} role="search" className="flex items-center overflow-hidden rounded-lg border border-line bg-mist">
            <span className="pl-3.5 text-brand-soft" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search suits, colours, occasions…"
              className="h-11 w-full bg-transparent px-3 text-sm text-ink placeholder:text-brand-soft/70 focus:outline-none"
              aria-label="Search the collection"
            />
            <button
              type="submit"
              className="h-11 shrink-0 bg-brand dark:bg-amber-600 dark:text-gray-950 px-5 text-[0.62rem] font-semibold uppercase tracking-brand text-white transition-colors hover:bg-brand-dark dark:hover:bg-amber-500"
            >
              Search
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}
