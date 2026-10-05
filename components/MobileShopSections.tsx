"use client";

import Link from "next/link";

/**
 * Jumia-style mobile-only sections rendered above the featured products.
 * Hidden on md+ where the editorial desktop layout takes over.
 */

const CATEGORIES = [
  { label: "All", href: "/shop", emoji: "🛍️" },
  { label: "Corporate", href: "/shop?category=corporate", emoji: "💼" },
  { label: "Casual", href: "/shop?category=premium_casual", emoji: "✨" },
  { label: "Linen", href: "/shop?colour=linen", emoji: "🌿" },
  { label: "Navy", href: "/shop?colour=navy", emoji: "🎩" },
  { label: "Charcoal", href: "/shop?colour=charcoal", emoji: "🌫️" },
  { label: "Fit Guide", href: "/fit-guide", emoji: "📐" },
];

const OCCASIONS = [
  { label: "Boardroom", href: "/shop?occasion=boardroom", color: "#3B4654" },
  { label: "Church", href: "/shop?occasion=church", color: "#4A5568" },
  { label: "Wedding", href: "/shop?occasion=wedding", color: "#5A6675" },
  { label: "Events", href: "/shop?occasion=events", color: "#6B7280" },
];

export function MobileShopSections() {
  return (
    <div className="md:hidden">

      {/* ── Promo banner ─────────────────────────────────────── */}
      <div className="relative mx-0 overflow-hidden bg-brand-deeper">
        <div
          className="relative flex items-center justify-between px-5 py-5"
          style={{
            backgroundImage: "url('/products/executive-charcoal-life.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deeper/95 via-brand-deeper/80 to-transparent" />

          {/* Text */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider text-amber-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Flash Deal · 20% Off
            </div>
            <p
              className="mt-2 font-display text-xl leading-tight text-white"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              Premium Suits
              <br />
              <span className="text-taupe-light">Made Simple</span>
            </p>
            <p className="mt-1.5 text-xs text-white/60">Standard sizing · Made to measure</p>
            <Link
              href="/shop"
              className="mt-3.5 inline-flex items-center gap-1.5 rounded bg-white px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-widest text-brand transition-colors hover:bg-mist active:scale-95"
            >
              Shop now
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Decorative right side — suit mark */}
          <div className="relative z-10 mr-2 opacity-25">
            <svg viewBox="0 0 100 100" className="h-24 w-24 text-white" fill="currentColor" aria-hidden="true">
              <path d="M38 17 L14 25 L30 42 L44 33 Z" />
              <path d="M62 17 L86 25 L70 42 L56 33 Z" />
              <path d="M50 22 L56.5 28.5 L50 35 L43.5 28.5 Z" />
              <path d="M45.5 31.5 L54.5 31.5 L58 62 L50 74 L42 62 Z" />
              <circle cx="50" cy="82" r="3" />
            </svg>
          </div>
        </div>

        {/* ── Jumia Trust / Guarantee Strip ── */}
        <div className="grid grid-cols-3 border-t border-white/10 bg-brand-dark/90 px-2 py-2 text-center text-[0.55rem] font-medium tracking-wide text-white/80">
          <div className="flex items-center justify-center gap-1 border-r border-white/10">
            <span>🚚</span> Free Delivery
          </div>
          <div className="flex items-center justify-center gap-1 border-r border-white/10">
            <span>✂️</span> Made to Measure
          </div>
          <div className="flex items-center justify-center gap-1">
            <span>🔒</span> Paystack Secure
          </div>
        </div>
      </div>

      {/* ── Category chip strip (horizontal scroll) ───────────── */}
      <div className="border-b border-line bg-white px-0 py-0">
        <div
          className="flex gap-0 overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex shrink-0 flex-col items-center gap-1.5 px-4 py-3 transition-colors hover:bg-mist"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mist text-xl">
                {cat.emoji}
              </span>
              <span className="whitespace-nowrap text-[0.58rem] font-semibold uppercase tracking-widest text-brand-light">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Occasion chips ────────────────────────────────────── */}
      <div className="bg-white px-4 py-4">
        <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-widest text-brand-soft">
          Shop by occasion
        </p>
        <div className="grid grid-cols-4 gap-2">
          {OCCASIONS.map((occ) => (
            <Link
              key={occ.label}
              href={occ.href}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-line bg-mist/60 py-3 transition-colors hover:border-brand/30 hover:bg-brand/[0.04]"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: occ.color }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M16 3H8l-1 6h10l-1-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M7 9l1 12h8l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-center text-[0.56rem] font-semibold uppercase leading-tight tracking-wide text-brand-light">
                {occ.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Section heading for the product grid ─────────────── */}
      <div className="flex items-center justify-between bg-white px-4 pb-3 pt-5">
        <div>
          <p className="text-[0.56rem] font-semibold uppercase tracking-widest text-brand-soft">
            The Collection
          </p>
          <h2
            className="mt-1 text-lg text-ink"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            Top Picks
          </h2>
        </div>
        <Link
          href="/shop"
          className="flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-widest text-brand transition-colors hover:text-brand-dark"
        >
          See all
          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
