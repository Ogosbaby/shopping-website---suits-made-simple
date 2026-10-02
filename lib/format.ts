import type { Measurements, OrderItem } from "@/types";

/**
 * All money in the store is stored as an integer in kobo — the minor unit of
 * the naira — so totals never suffer floating-point drift.
 */

export function formatMoney(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMeasurements(measurements: Measurements | null): string {
  if (!measurements) return "";
  return [
    `Neck ${measurements.neck}"`,
    `Chest ${measurements.chest}"`,
    `Waist ${measurements.waist}"`,
    `Jacket ${measurements.jacket_length}"`,
    `Sleeve ${measurements.sleeve_length}"`,
    `Trouser ${measurements.trouser_length}"`,
  ].join(" · ");
}

export function describeSize(item: Pick<OrderItem, "size_type" | "standard_size" | "measurements">): string {
  if (item.size_type === "custom") {
    return formatMeasurements(item.measurements) || "Custom tailoring";
  }
  return `Standard ${item.standard_size ?? "—"}`;
}

export function orderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `SMS-${stamp}-${suffix}`;
}
