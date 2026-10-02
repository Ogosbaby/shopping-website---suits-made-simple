import type { Order, OrderItem } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";

/**
 * Marks a pending order as paid and issues the confirmation email exactly once.
 *
 * Both the Paystack callback and the webhook call this, and Paystack retries
 * webhooks, so settlement is guarded by a status transition: only the caller
 * that moves the order out of `pending_payment` sends the email.
 */

export interface SettlementResult {
  orderNumber: string;
  emailSent: boolean;
  /** True when another caller had already settled this payment. */
  alreadySettled: boolean;
}

export async function settlePaidOrder(
  reference: string,
  paidAmountKobo?: number
): Promise<SettlementResult | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (error || !order) {
    console.error("[paystack] no order found for reference", reference, error?.message ?? "");
    return null;
  }

  const existing = order as Order;

  // Never settle a payment that does not cover the order.
  if (typeof paidAmountKobo === "number" && paidAmountKobo < existing.total_cents) {
    console.error(
      `[paystack] underpayment on ${existing.order_number}: paid ${paidAmountKobo}, expected ${existing.total_cents}`
    );
    return null;
  }

  if (existing.status === "paid") {
    return { orderNumber: existing.order_number, emailSent: true, alreadySettled: true };
  }

  const { data: settled } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: reference,
    })
    .eq("id", existing.id)
    .neq("status", "paid")
    .select("*")
    .maybeSingle();

  if (!settled) {
    // Another caller won the race and is sending the email.
    return { orderNumber: existing.order_number, emailSent: true, alreadySettled: true };
  }

  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", existing.id)
    .order("id", { ascending: true });

  const emailSent = await sendOrderConfirmationEmail(
    settled as Order,
    (items ?? []) as OrderItem[]
  );

  // The order is paid, so the cart can be emptied.
  if (existing.cart_id) {
    const { error: clearError } = await admin
      .from("cart_items")
      .delete()
      .eq("cart_id", existing.cart_id);
    if (clearError) console.error("[paystack] failed to clear cart:", clearError.message);
  }

  return { orderNumber: existing.order_number, emailSent, alreadySettled: false };
}
