"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import {
  MEASUREMENT_FIELDS,
  STANDARD_SIZES,
  type Measurements,
  type ProductVariant,
} from "@/types";
import { formatMoney } from "@/lib/format";

type SizeType = "standard" | "custom";

const EMPTY_MEASUREMENTS: Measurements = {
  neck: "",
  chest: "",
  waist: "",
  jacket_length: "",
  sleeve_length: "",
  trouser_length: "",
};

export function PurchasePanel({
  productId,
  priceCents,
  variants,
}: {
  productId: string;
  priceCents: number;
  variants: ProductVariant[];
}) {
  const { addItem } = useCart();

  const availableSizes = variants.length > 0 ? variants.map((v) => v.size) : STANDARD_SIZES;
  const [sizeType, setSizeType] = useState<SizeType>("standard");
  const [size, setSize] = useState<string>(availableSizes[0] ?? "40R");
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  function updateMeasurement(key: keyof Measurements, value: string) {
    setMeasurements((current) => ({ ...current, [key]: value }));
  }

  async function handleAddToCart() {
    if (sizeType === "custom") {
      const missing = MEASUREMENT_FIELDS.some(
        ({ key }) => !measurements[key] || Number(measurements[key]) <= 0
      );
      if (missing) {
        setStatus({
          kind: "error",
          message: "Please provide all six measurements for custom tailoring.",
        });
        return;
      }
    }

    setSubmitting(true);
    setStatus(null);

    const success = await addItem({
      productId,
      sizeType,
      standardSize: sizeType === "standard" ? size : undefined,
      measurements: sizeType === "custom" ? measurements : undefined,
      quantity,
    });

    setSubmitting(false);

    if (success) {
      setStatus({ kind: "success", message: "Added to your cart." });
      setMeasurements(EMPTY_MEASUREMENTS);
      setQuantity(1);
    }
  }

  return (
    <div>
      <p className="label-caps">Sizing</p>

      {/* Option selector */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setSizeType("standard");
            setStatus(null);
          }}
          className={`border p-4 text-left transition-colors ${
            sizeType === "standard"
              ? "border-brand bg-brand/[0.04]"
              : "border-line bg-surface hover:border-brand-light"
          }`}
          aria-pressed={sizeType === "standard"}
        >
          <span className="block text-[0.62rem] font-semibold uppercase tracking-brand text-brand-soft">
            Option A
          </span>
          <span className="mt-1 block font-display text-sm text-ink">Standard, off-the-rack</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSizeType("custom");
            setStatus(null);
          }}
          className={`border p-4 text-left transition-colors ${
            sizeType === "custom"
              ? "border-brand bg-brand/[0.04]"
              : "border-line bg-surface hover:border-brand-light"
          }`}
          aria-pressed={sizeType === "custom"}
        >
          <span className="block text-[0.62rem] font-semibold uppercase tracking-brand text-brand-soft">
            Option B
          </span>
          <span className="mt-1 block font-display text-sm text-ink">Custom tailoring</span>
        </button>
      </div>

      {sizeType === "standard" ? (
        <div className="mt-6">
          <label htmlFor="size-select" className="field-label">
            Select size
          </label>
          <select
            id="size-select"
            value={size}
            onChange={(event) => setSize(event.target.value)}
            className="input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235A6675%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:1.1rem] bg-[right_1rem_center] bg-no-repeat pr-12"
          >
            {availableSizes.map((availableSize) => (
              <option key={availableSize} value={availableSize}>
                {availableSize}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-brand-soft">
            Chest 38″–50″ · R = regular drop, L = long drop
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <p className="field-label">Your measurements (inches)</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {MEASUREMENT_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label htmlFor={`measurement-${key}`} className="mb-1.5 block text-xs font-medium text-brand-light">
                  {label}
                </label>
                <input
                  id={`measurement-${key}`}
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max="80"
                  step="0.25"
                  value={measurements[key]}
                  onChange={(event) => updateMeasurement(key, event.target.value)}
                  placeholder="0.0"
                  className="input"
                  required
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-soft">
            Measured by a professional for the finest result. Our concierge reviews every bespoke order.
          </p>
        </div>
      )}

      {/* Quantity */}
      <div className="mt-8 flex items-center gap-5">
        <p className="field-label !mb-0">Quantity</p>
        <div className="inline-flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-11 w-11 text-brand-light transition-colors hover:text-ink"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="h-11 w-11 text-brand-light transition-colors hover:text-ink"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart — sticky at the bottom on mobile, inline on desktop. */}
      <div className="sticky bottom-0 z-30 -mx-5 mt-8 border-t border-line bg-paper/95 px-5 pt-3 pb-safe backdrop-blur md:static md:mx-0 md:border-t-0 md:bg-transparent md:px-0 md:pt-0 md:pb-0 md:backdrop-blur-none">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={submitting}
          className="btn-primary w-full"
        >
          {submitting ? "Adding…" : `Add to cart — ${formatMoney(priceCents * quantity)}`}
        </button>

        {status ? (
          <div
            role="status"
            className={`mt-3 mb-3 border px-4 py-3 text-sm md:mb-0 ${
              status.kind === "success"
                ? "border-brand/30 bg-brand/[0.05] text-brand"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status.message}
            {status.kind === "success" ? (
              <>
                {" "}
                <Link href="/cart" className="font-semibold underline underline-offset-4">
                  View cart
                </Link>
              </>
            ) : null}
          </div>
        ) : (
          <div className="h-3 md:hidden" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
