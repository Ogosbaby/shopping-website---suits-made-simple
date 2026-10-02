"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";
import { useCart } from "@/components/CartProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/fit-guide", label: "Fit Guide" },
  { href: "/#about", label: "About" },
];

export function Header() {
  const { count } = useCart();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="shell flex h-20 items-center justify-between gap-6">
        <Logo markClassName="h-9 w-9" wordClassName="text-xl" />

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

        <div className="flex items-center gap-2 sm:gap-4">
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

          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand"
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
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center bg-brand px-1 text-[0.6rem] font-semibold text-white">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center text-ink md:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="shell flex flex-col py-4" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-xs font-semibold uppercase tracking-brand text-brand-light"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/checkout"
              className="py-3 text-xs font-semibold uppercase tracking-brand text-brand-light"
            >
              Checkout
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="py-3 text-xs font-semibold uppercase tracking-brand text-brand-light"
            >
              {user ? "Account" : "Sign in"}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
