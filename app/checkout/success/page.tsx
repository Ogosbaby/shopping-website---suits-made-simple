import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatMoney, describeSize, formatDate } from "@/lib/format";
import type { Order, OrderItem } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
};

async function getOrder(orderNumber: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  const admin = createSupabaseAdminClient();
  if (!admin || !orderNumber) return null;

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("id", { ascending: true });

  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string; email?: string; from?: string };
}) {
  const orderNumber = searchParams.order ?? "";
  const emailFailed = searchParams.email === "0";
  const isApp = searchParams.from === "app";
  const result = await getOrder(orderNumber);

  return (
    <div className="shell py-16 sm:py-24">
      <ClearCartOnSuccess />
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center border border-brand/25 bg-brand/[0.05] text-brand">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="label-caps mt-7">
          {result?.order.status === "paid" ? "Payment received" : "Order confirmed"}
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
          {result ? `Thank you, ${result.order.full_name.split(/\s+/)[0]}.` : "Thank you for your order."}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-brand-light">
          {result ? (
            <>
              Your order <span className="font-semibold text-brand">{result.order.order_number}</span>{" "}
              has been received and recorded. A confirmation email is on its way to{" "}
              <span className="font-medium text-ink">{result.order.email}</span>.
              {result.order.status === "paid" ? " Your payment cleared with Paystack." : ""}
            </>
          ) : (
            <>
              Your order has been recorded. Keep your order reference{" "}
              <span className="font-semibold text-brand">{orderNumber || "—"}</span> for your records.
            </>
          )}
        </p>
        {emailFailed ? (
          <p className="mx-auto mt-4 max-w-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            We could not dispatch the confirmation email automatically. Our concierge will email your
            receipt shortly — or reach us at concierge@suitsmadesimple.com.
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="mx-auto mt-14 max-w-2xl border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-7 py-5">
            <div>
              <p className="label-caps">Order reference</p>
              <p className="mt-1 font-display text-lg text-ink">{result.order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="label-caps">Placed</p>
              <p className="mt-1 text-sm text-brand-light">{formatDate(result.order.created_at)}</p>
              {result.order.paid_at ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-brand text-brand">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Paid
                </p>
              ) : null}
            </div>
          </div>

          <ul className="divide-y divide-line px-7">
            {result.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-6 py-5">
                <div>
                  <p className="font-medium text-ink">{item.product_name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-soft">
                    × {item.quantity} — {describeSize(item)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-brand">
                  {formatMoney(item.line_total_cents)}
                </p>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-7 py-5">
            <div className="flex justify-between text-sm">
              <span className="text-brand-light">Subtotal</span>
              <span className="font-medium text-ink">{formatMoney(result.order.subtotal_cents)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-brand-light">Shipping</span>
              <span className="font-medium text-ink">Complimentary</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3">
              <span className="font-display text-ink">Total</span>
              <span className="font-semibold text-ink">{formatMoney(result.order.total_cents)}</span>
            </div>
          </div>

          <div className="border-t border-line bg-mist/60 px-7 py-5">
            <p className="label-caps">Delivering to</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-light">
              {result.order.full_name}
              <br />
              {result.order.address_line1}
              {result.order.address_line2 ? (
                <>
                  <br />
                  {result.order.address_line2}
                </>
              ) : null}
              <br />
              {result.order.city}, {result.order.state}
              {result.order.postal_code ? ` ${result.order.postal_code}` : ""}
              <br />
              {result.order.country}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-12 flex flex-wrap justify-center gap-4">
        <Link href={isApp ? "/shop?from=app" : "/shop"} className="btn-primary">
          Continue shopping
        </Link>
        <Link href={isApp ? "/account?from=app" : "/account"} className="btn-outline">
          View your account
        </Link>
      </div>
    </div>
  );
}
