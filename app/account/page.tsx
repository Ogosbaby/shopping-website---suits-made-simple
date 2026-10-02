import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { describeSize, formatDate, formatMoney } from "@/lib/format";
import type { Order, OrderItem } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
};

type OrderWithItems = Order & { order_items: OrderItem[] };

export default async function AccountPage() {
  const supabase = createSupabaseServerClient();
  if (!supabase) redirect("/login?error=config");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (error ? [] : (data ?? [])) as OrderWithItems[];

  return (
    <div className="shell py-16 sm:py-20">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-caps">Your account</p>
          <h1 className="section-title mt-3">Orders</h1>
          <p className="mt-4 text-sm text-brand-light">
            Signed in as <span className="font-medium text-ink">{user.email}</span>
          </p>
        </div>
        <SignOutButton />
      </header>

      {orders.length === 0 ? (
        <div className="mt-12 border border-line bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl text-ink">No orders yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-light">
            When you place an order it will appear here with its full tailoring details.
          </p>
          <Link href="/shop" className="btn-primary mt-8">
            Shop the collection
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-8">
          {orders.map((order) => (
            <article key={order.id} className="border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-7 py-5">
                <div>
                  <p className="label-caps">Order reference</p>
                  <p className="mt-1 font-display text-lg text-ink">{order.order_number}</p>
                </div>
                <div className="flex flex-wrap items-center gap-8">
                  <div>
                    <p className="label-caps">Placed</p>
                    <p className="mt-1 text-sm text-brand-light">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="label-caps">Status</p>
                    <p className="mt-1 text-sm capitalize text-brand-light">{order.status}</p>
                  </div>
                  <div>
                    <p className="label-caps">Total</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {formatMoney(order.total_cents)}
                    </p>
                  </div>
                </div>
              </div>

              <ul className="divide-y divide-line px-7">
                {order.order_items?.map((item) => (
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
