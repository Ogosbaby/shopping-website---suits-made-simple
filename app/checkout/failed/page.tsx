import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment not completed",
};

export default function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const reference = searchParams.reference ?? "";

  return (
    <div className="shell py-20 sm:py-28">
      <div className="mx-auto max-w-xl text-center">
        <p className="label-caps">Payment not completed</p>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">
          Your payment was not confirmed.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-brand-light">
          Nothing has been charged and your cart is still intact. You can return to checkout and try
          again, or pay by bank transfer with the concierge.
        </p>
        {reference ? (
          <p className="mt-6 text-xs uppercase tracking-brand text-brand-soft">
            Reference {reference}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/checkout" className="btn-primary">
            Try payment again
          </Link>
          <Link href="/cart" className="btn-outline">
            Back to cart
          </Link>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-brand-soft">
          Already debited? Write to concierge@suitsmadesimple.com with the reference above and we will
          reconcile it immediately.
        </p>
      </div>
    </div>
  );
}
