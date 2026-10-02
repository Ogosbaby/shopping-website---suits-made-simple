"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORY_LABELS, STANDARD_SIZES, type Product } from "@/types";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/CartProvider";

export function ProductCard({ product }: { product: Product }) {
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

  return (
    <div className="group flex flex-col border border-line bg-white shadow-card transition-shadow duration-300 hover:shadow-lift">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-mist">
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
        <p className="label-caps">
          {CATEGORY_LABELS[product.category]}
          {product.colour ? ` · ${product.colour}` : ""}
        </p>
        <Link href={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-brand">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 text-sm font-medium text-brand">{formatMoney(product.price_cents)}</p>

        {/* Quick Add To Cart Section */}
        <div className="mt-auto pt-5">
          <div className="flex items-center gap-2">
            <select
              aria-label={`Select size for ${product.name}`}
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="h-9 rounded-none border border-line bg-mist/60 px-2.5 text-xs font-medium text-ink focus:border-brand focus:outline-none"
            >
              {STANDARD_SIZES.map((size) => (
                <option key={size} value={size}>
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
                  : "border-brand bg-brand text-white hover:bg-brand-dark active:scale-[0.98]"
              }`}
              title="Add standard size to cart"
            >
              {added ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Added</span>
                </>
              ) : adding ? (
                <span>Adding…</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
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
                  <span>Add to cart</span>
                </>
              )}
            </button>
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="mt-2 block text-center text-[0.62rem] uppercase tracking-brand text-brand-soft hover:text-brand"
          >
            Or Made-to-Measure &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
