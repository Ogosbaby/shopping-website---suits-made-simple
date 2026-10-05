"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORY_LABELS, STANDARD_SIZES, type Product } from "@/types";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/CartProvider";

interface ProductCardProps {
  product: Product;
  /**
   * Compact mode for the Jumia-style 2-column mobile grid.
   * Reduces padding, hides the quick-add select and shows only
   * a simple "Add" button, keeping cards tight.
   */
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("40R");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const gallery = product.images?.length ? product.images : [product.image];
  const alternate = gallery[1];

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;

    setAdding(true);
    const success = await addItem({
      productId: product.id,
      sizeType: "standard",
      standardSize: selectedSize,
      quantity: 1,
    });
    setAdding(false);

    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2400);
    }
  }

  /* ── Compact card (Jumia-style mobile 2-col grid) ── */
  if (compact) {
    return (
      <div className="group flex flex-col bg-surface dark:bg-[#18202A]">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden bg-mist dark:bg-[#12161C]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            {alternate ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alternate}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                loading="lazy"
              />
            ) : null}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-3">
          <p className="text-[0.52rem] font-semibold uppercase tracking-wider text-brand-soft dark:text-gray-400">
            {CATEGORY_LABELS[product.category]}
          </p>
          <Link href={`/products/${product.slug}`} className="mt-1 block">
            <h3 className="line-clamp-2 text-xs font-medium leading-snug text-ink dark:text-gray-100 transition-colors group-hover:text-brand dark:group-hover:text-amber-400">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1.5 text-sm font-semibold text-brand dark:text-amber-400">{formatMoney(product.price_cents)}</p>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={adding}
            className={`mt-auto pt-3 flex h-8 w-full items-center justify-center gap-1 text-[0.6rem] font-semibold uppercase tracking-wider transition-all ${
              added
                ? "bg-emerald-700 text-white"
                : "bg-brand dark:bg-amber-600 text-white dark:text-gray-950 hover:bg-brand-dark dark:hover:bg-amber-700 active:scale-[0.97]"
            }`}
            title={`Add ${product.name} to cart`}
          >
            {added ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Added
              </>
            ) : adding ? (
              "Adding…"
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                  <path d="M3 3.5h2.2l2.2 11h11.4l2.2-7.5H6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="19" r="1.4" fill="currentColor" />
                  <circle cx="17" cy="19" r="1.4" fill="currentColor" />
                </svg>
                Add to cart
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ── Standard card (desktop / list view) ── */
  return (
    <div className="group flex flex-col border border-line dark:border-[#2C3746] bg-surface dark:bg-[#18202A] shadow-card transition-shadow duration-300 hover:shadow-lift">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-mist dark:bg-[#12161C]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {alternate ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={alternate}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              loading="lazy"
            />
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="label-caps dark:text-gray-400">
          {CATEGORY_LABELS[product.category]}
          {product.colour ? ` · ${product.colour}` : ""}
        </p>
        <Link href={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="font-display text-lg leading-snug text-ink dark:text-gray-100 transition-colors group-hover:text-brand dark:group-hover:text-amber-400">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-sm font-medium text-brand dark:text-amber-400">{formatMoney(product.price_cents)}</p>

        {/* Quick Add To Cart Section */}
        <div className="mt-auto pt-5">
          <div className="flex items-center gap-2">
            <select
              aria-label={`Select size for ${product.name}`}
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="h-9 rounded-none border border-line dark:border-[#2C3746] bg-mist/60 dark:bg-[#12161C] px-2.5 text-xs font-medium text-ink dark:text-gray-200 focus:border-brand focus:outline-none"
            >
              {STANDARD_SIZES.map((size) => (
                <option key={size} value={size} className="dark:bg-[#18202A] dark:text-gray-200">
                  {size}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={adding}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 border text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                added
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-brand bg-brand dark:border-amber-600 dark:bg-amber-600 text-white dark:text-gray-950 hover:bg-brand-dark dark:hover:bg-amber-700 active:scale-[0.98]"
              }`}
              title={added ? "Added to cart" : "Add standard size to cart"}
              aria-label={added ? "Added to cart" : "Add to cart"}
            >
              {added ? (
                <>
                  {/* Check icon — always visible */}
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {/* Label — hidden on small cards, visible on larger screens */}
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : adding ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" strokeDasharray="28 56" />
                  </svg>
                  <span className="hidden sm:inline">Adding…</span>
                </>
              ) : (
                <>
                  {/* Cart icon — always visible */}
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
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
                  {/* Label — hidden on small cards, visible on larger screens */}
                  <span className="hidden sm:inline">Add to cart</span>
                </>
              )}
            </button>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="mt-2 block text-center text-[0.62rem] uppercase tracking-brand text-brand-soft dark:text-gray-400 hover:text-brand dark:hover:text-amber-400"
          >
            Or Made-to-Measure &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
