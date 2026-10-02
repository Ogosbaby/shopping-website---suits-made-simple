"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatMoney, describeSize } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

const CONTACT_FIELDS: { key: keyof FormState; label: string; type?: string; required?: boolean }[] = [
  { key: "fullName", label: "Full name", required: true },
  { key: "email", label: "Email address", type: "email", required: true },
  { key: "phone", label: "Phone number", type: "tel", required: true },
];

const ADDRESS_FIELDS: { key: keyof FormState; label: string; required?: boolean; optional?: boolean; wide?: boolean }[] = [
  { key: "addressLine1", label: "Address line 1", required: true, wide: true },
  { key: "addressLine2", label: "Address line 2", optional: true, wide: true },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State / region", required: true },
  { key: "postalCode", label: "Postal code", optional: true },
  { key: "country", label: "Country", required: true, wide: true },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading, configured, subtotalCents, clear } = useCart();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setForm((current) => ({
          ...current,
          email: current.email || user.email || "",
          fullName:
            current.fullName ||
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            "",
        }));
      }
    });
  }, []);

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        orderNumber?: string;
        emailSent?: boolean;
        authorizationUrl?: string;
        error?: string;
      };

      if (!response.ok || data.error) {
        setServerError(data.error ?? "Unable to place your order.");
        setSubmitting(false);
        return;
      }

      // Paystack is configured: hand the buyer to its secure checkout. The cart
      // stays until the payment is verified on the server.
      if (data.authorizationUrl) {
        setNotice("Redirecting you to Paystack…");
        window.location.assign(data.authorizationUrl);
        return;
      }

      clear();
      const emailParam = data.emailSent === false ? "&email=0" : "";
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber ?? "")}${emailParam}`);
    } catch {
      setServerError("Unable to place your order. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="shell py-16 sm:py-20">
      <header className="max-w-2xl">
        <p className="label-caps">Final step</p>
        <h1 className="section-title mt-3">Checkout</h1>
      </header>

      {loading ? (
        <div className="mt-12 h-64 animate-pulse bg-mist" />
      ) : !configured || items.length === 0 ? (
        <div className="mt-12 border border-line bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl text-ink">There is nothing to check out yet.</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-light">
            {configured
              ? "Add a piece to your cart and return here to pay by card, bank transfer or USSD."
              : "Checkout opens once the store is connected to its database. Until then the collection remains fully browsable."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn-primary">
              Shop the collection
            </Link>
            <Link href="/cart" className="btn-outline">
              View cart
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-12">
            <section>
              <h2 className="font-display text-lg text-ink">Contact</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {CONTACT_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`checkout-${field.key}`} className="field-label">
                      {field.label}
                    </label>
                    <input
                      id={`checkout-${field.key}`}
                      type={field.type ?? "text"}
                      value={form[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      required={field.required}
                      className="input"
                      autoComplete="on"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg text-ink">Shipping address</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {ADDRESS_FIELDS.map((field) => (
                  <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
                    <label htmlFor={`checkout-${field.key}`} className="field-label">
                      {field.label}
                      {field.optional ? " (optional)" : ""}
                    </label>
                    <input
                      id={`checkout-${field.key}`}
                      type="text"
                      value={form[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      required={field.required}
                      className="input"
                      autoComplete="on"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit border border-line bg-white p-7 shadow-card lg:sticky lg:top-28">
            <h2 className="font-display text-lg text-ink">Your order</h2>
            <ul className="mt-6 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-4 text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.product?.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-brand-soft">
                      × {item.quantity} — {describeSize({
                        size_type: item.size_type,
                        standard_size: item.standard_size,
                        measurements: item.measurements,
                      })}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium text-brand">
                    {formatMoney((item.product?.price_cents ?? 0) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
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

            {serverError ? (
              <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </p>
            ) : null}

            {notice ? (
              <p className="mt-5 border border-line bg-mist px-4 py-3 text-sm text-brand-light">
                {notice}
              </p>
            ) : null}

            <button type="submit" disabled={submitting} className="btn-primary mt-7 w-full">
              {submitting ? "Opening payment…" : "Continue to payment"}
            </button>

            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-brand-soft">
              <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <path
                  d="M12 3.5 5.5 6v6c0 4 3 6.8 6.5 8 3.5-1.2 6.5-4 6.5-8V6L12 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              Payment is handled securely by Paystack — card, bank transfer or USSD. A receipt is
              emailed to you as soon as the payment clears.
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}
