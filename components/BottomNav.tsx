"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/components/CartProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useIsApp } from "@/lib/useIsApp";

/**
 * Jumia-style bottom tab bar.
 *
 * Only rendered inside the Capacitor native app shell. Regular mobile/tablet
 * browsers receive the normal responsive web layout instead.
 *
 * Active tab is highlighted with the brand gold accent; inactive tabs use a
 * muted slate so the active destination is immediately legible.
 */
export function BottomNav() {
  const isApp = useIsApp();
  const pathname = usePathname();
  const { count } = useCart();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Apply body bottom padding only when the BottomNav is visible (inside app)
  useEffect(() => {
    if (isApp) {
      document.body.style.paddingBottom = "calc(4.75rem + env(safe-area-inset-bottom))";
    } else {
      document.body.style.paddingBottom = "";
    }
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [isApp]);

  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: (
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      href: "/shop",
      label: "Shop",
      icon: (
        <>
          <path
            d="M4 4h16l-1.4 11.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8L4 4Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ),
    },
    {
      href: "/fit-guide",
      label: "Fit",
      icon: (
        <>
          <path d="M3.5 14.5 14.5 3.5l6 6L9.5 20.5l-6-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 10l1.5 1.5M11 7l1.5 1.5M14 4l1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ),
    },
    {
      href: "/cart",
      label: "Cart",
      badge: count,
      icon: (
        <>
          <path
            d="M3 3.5h2.2l2.2 11h11.4l2.2-7.5H6.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="19" r="1.6" fill="currentColor" />
          <circle cx="17" cy="19" r="1.6" fill="currentColor" />
        </>
      ),
    },
    {
      href: user ? "/account" : "/login",
      label: user ? "Account" : "Sign in",
      icon: (
        <>
          <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 20c.7-3.7 3.8-6 7.5-6s6.8 2.3 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ),
    },
  ];

  // Only show the app-style BottomNav inside the Capacitor native shell.
  // On a regular mobile/tablet browser the Header handles navigation.
  if (!isApp) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper shadow-[0_-4px_25px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)] transition-colors"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary navigation"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <li key={tab.label} className="relative">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-1 transition-all active:scale-95 ${
                  active ? "text-ink dark:text-amber-400" : "text-brand-light dark:text-gray-400 hover:text-ink dark:hover:text-white"
                }`}
              >
                {/* Active top accent indicator */}
                {active ? (
                  <span
                    className="absolute top-0 h-[3px] w-9 rounded-b-full bg-brand dark:bg-amber-400"
                    aria-hidden="true"
                  />
                ) : null}

                {/* Icon wrapper with subtle active background */}
                <span className={`relative flex h-8 w-11 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-mist dark:bg-amber-400/15" : "bg-transparent"
                }`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-[1.4rem] w-[1.4rem] ${active ? "stroke-[2.2]" : "stroke-[1.8]"}`}
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </svg>
                  {/* Cart badge */}
                  {typeof tab.badge === "number" && tab.badge > 0 ? (
                    <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand dark:bg-amber-400 px-1 text-[0.55rem] font-bold text-white dark:text-gray-950 shadow-sm ring-2 ring-paper">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                </span>

                {/* Label */}
                <span
                  className={`text-[0.62rem] uppercase tracking-wider ${
                    active ? "font-bold text-ink dark:text-amber-400" : "font-semibold text-brand-light dark:text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
