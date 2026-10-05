"use client";

import Link from "next/link";
import { useState } from "react";
import { COLOURS, OCCASIONS, type ProductCategory } from "@/types";

interface ActiveFilters {
  category?: string;
  colour?: string;
  occasion?: string;
  q?: string;
}

const CATEGORIES: { label: string; value: ProductCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Corporate", value: "corporate" },
  { label: "Premium Casual", value: "premium_casual" },
];

function buildHref(params: ActiveFilters): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.colour) search.set("colour", params.colour);
  if (params.occasion) search.set("occasion", params.occasion);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `/shop?${query}` : "/shop";
}

function Pill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border px-2.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-brand transition-colors ${
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-surface text-brand-light hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </Link>
  );
}

/**
 * A slim bar showing the result count, plus the filters tucked behind a toggle.
 * The collection itself is what a visitor should meet first.
 */
export function ShopFilters({ count, category, colour, occasion, q }: ActiveFilters & { count: number }) {
  const hasFilters = Boolean(category || colour || occasion || q);
  const [open, setOpen] = useState(hasFilters);

  /** Every filter link keeps the active search term. */
  const href = (overrides: ActiveFilters) => buildHref({ q, ...overrides });

  const active: { label: string; href: string }[] = [];
  if (q) active.push({ label: `“${q}”`, href: href({ q: undefined }) });
  if (category)
    active.push({
      label: category === "premium_casual" ? "Premium Casual" : "Corporate",
      href: href({ category: undefined }),
    });
  if (occasion) active.push({ label: occasion, href: href({ occasion: undefined }) });
  if (colour) active.push({ label: colour, href: href({ colour: undefined }) });

  return (
    <div className="border-y border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.6rem] uppercase tracking-brand text-brand-soft">
            {count} {count === 1 ? "piece" : "pieces"}
          </span>
          {active.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center gap-1.5 border border-line bg-surface px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-brand text-brand transition-colors hover:border-brand"
            >
              {chip.label}
              <span aria-hidden="true" className="text-brand-soft">
                ×
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {hasFilters ? (
            <Link
              href="/shop"
              className="text-[0.6rem] font-semibold uppercase tracking-brand text-brand-soft transition-colors hover:text-ink"
            >
              Clear
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="inline-flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-brand text-ink transition-colors hover:text-brand"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M4 7h16M7 12h10M10 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {open ? "Hide filters" : "Filters"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-line py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 w-16 shrink-0 text-[0.58rem] uppercase tracking-brand text-brand-soft">
              Category
            </span>
            {CATEGORIES.map((entry) => (
              <Pill
                key={entry.value}
                label={entry.label}
                active={(entry.value === "all" && !category) || entry.value === category}
                href={href({ category: entry.value === "all" ? undefined : entry.value })}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 w-16 shrink-0 text-[0.58rem] uppercase tracking-brand text-brand-soft">
              Occasion
            </span>
            <Pill label="Any" active={!occasion} href={href({ occasion: undefined })} />
            {OCCASIONS.map((entry) => (
              <Pill
                key={entry}
                label={entry}
                active={entry === occasion}
                href={href({ occasion: entry })}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 w-16 shrink-0 text-[0.58rem] uppercase tracking-brand text-brand-soft">
              Colour
            </span>
            <Pill label="Any" active={!colour} href={href({ colour: undefined })} />
            {COLOURS.map((entry) => (
              <Pill key={entry} label={entry} active={entry === colour} href={href({ colour: entry })} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
