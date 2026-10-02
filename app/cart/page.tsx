"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import { CATEGORY_LABELS } from "@/types";
import { describeSize } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CartPage() {
  const { items, loading, configured, error, subtotalCents, updateQuantity, removeItem } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  return (
    <div className="shell py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="label-caps">Your order</p>
        <h1 className="section-title mt-3">Cart</h1>
      </header>

      {loading ? (
        <div className="mt-12 animate-pulse space-y-4">
          <div className="h-28 bg-mist" />
          <div className="h-28 bg-mist" />
        </div>
      ) : !configured ? (
        <EmptyState
          title="The store is not connected yet."
          copy="Connect the database to begin adding garments to your cart. The collection remains fully browsable in the meantime."
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty."
          copy="Browse the collection and add a piece — standard sizing or made to measure."
        />
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <div key={item.id} className="flex gap-5 py-6 sm:gap-7">
                <Link
                  href={`/products/${item.product?.slug ?? ""}`}
                  className="h-32 w-24 shrink-0 overflow-hidden border border-line bg-mist sm:h-36 sm:w-28"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product?.image}
                    alt={item.product?.name ?? "Garment"}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="label-caps">
                        {item.product ? CATEGORY_LABELS[item.product.category] : "Garment"}
                      </p>
                      <Link
                        href={`/products/${item.product?.slug ?? ""}`}
                        className="mt-1 block font-display text-base text-ink transition-colors hover:text-brand sm:text-lg"
                      >
                        {item.product?.name ?? "Garment"}
                      </Link>
                      <p className="mt-1.5 text-xs text-brand-soft">
                        {item.size_type === "custom" ? "Custom tailoring" : "Off-the-rack"} —{" "}
                        {describeSize({
                          size_type: item.size_type,
                          standard_size: item.standard_size,
                          measurements: item.measurements,
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-brand">
                      {formatMoney((item.product?.price_cents ?? 0) * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-6 pt-4">
                    <div className="inline-flex items-center border border-line">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="h-9 w-9 text-brand-light transition-colors hover:text-ink disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.min(20, item.quantity + 1))}
                        disabled={item.quantity >= 20}
                        className="h-9 w-9 text-brand-light transition-colors hover:text-ink disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-[0.68rem] font-semibold uppercase tracking-brand text-brand-soft transition-colors hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit border border-line bg-white p-7 shadow-card lg:sticky lg:top-28">
            <h2 className="font-display text-lg text-ink">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-light">Subtotal</dt>
                <dd className="font-medium text-ink">{formatMoney(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-light">Shipping</dt>
                <dd className="font-medium text-ink">Complimentary</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-display text-ink">Total</dt>
                <dd className="font-semibold text-ink">{formatMoney(subtotalCents)}</dd>
              </div>
            </dl>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

            {!checkingAuth && !user ? (
              <div className="mt-7 border border-line bg-mist/60 p-5 text-center">
                <p className="font-display text-sm text-ink">Sign in to checkout</p>
                <p className="mt-1.5 text-xs leading-relaxed text-brand-light">
                  Sign in with Google to secure your custom measurements and proceed to payment.
                </p>
                <Link
                  href="/login?next=/checkout"
                  className="btn-primary mt-4 flex w-full items-center justify-center gap-2.5"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
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
                  Continue with Google
                </Link>
              </div>
            ) : (
              <>
                <Link href="/checkout" className="btn-primary mt-7 block w-full text-center">
                  Proceed to checkout
                </Link>
                {user ? (
                  <p className="mt-2 text-center text-xs text-brand-soft">
                    Signed in as <span className="font-medium text-ink">{user.email}</span>
                  </p>
                ) : null}
              </>
            )}
            <Link
              href="/shop"
              className="mt-4 block text-center text-[0.68rem] font-semibold uppercase tracking-brand text-brand-light transition-colors hover:text-ink"
            >
              Continue browsing
            </Link>
            <p className="mt-6 text-xs leading-relaxed text-brand-soft">
              Payment is taken on the next step through Paystack — card, bank transfer or USSD.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="mt-12 border border-line bg-white p-12 text-center shadow-card">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-light">{copy}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          Shop the collection
        </Link>
        <Link href="/checkout" className="btn-outline">
          Go to checkout
        </Link>
      </div>
    </div>
  );
}
