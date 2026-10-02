import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { orderNumber } from "@/lib/format";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";
import {
  initializeTransaction,
  isPaystackConfigured,
  paymentReference,
} from "@/lib/paystack";
import type { CartItem, Order, OrderItem } from "@/types";

/**
 * POST /api/checkout
 * 1. Validates the shipping details.
 * 2. Prices the cart from the database (never from the client).
 * 3. Persists the order and its items — including custom measurements.
 * 4a. With Paystack configured: opens a Paystack transaction and returns its
 *     checkout URL. The order stays `pending_payment` and the cart is kept
 *     until the payment is verified by the callback or the webhook.
 * 4b. Without Paystack: confirms the order immediately (demo mode).
 * 5. Sends the Mailgun confirmation email and clears the cart once paid.
 */

const CART_COOKIE = "sms_cart_id";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CheckoutPayload {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
}

function readField(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Checkout is unavailable: SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload: CheckoutPayload = {
    fullName: readField(body, "fullName"),
    email: readField(body, "email"),
    phone: readField(body, "phone"),
    addressLine1: readField(body, "addressLine1"),
    addressLine2: readField(body, "addressLine2"),
    city: readField(body, "city"),
    state: readField(body, "state"),
    postalCode: readField(body, "postalCode"),
    country: readField(body, "country"),
  };

  const required: [keyof CheckoutPayload, string][] = [
    ["fullName", "Full name"],
    ["email", "Email address"],
    ["phone", "Phone number"],
    ["addressLine1", "Address"],
    ["city", "City"],
    ["state", "State or region"],
    ["country", "Country"],
  ];

  for (const [field, label] of required) {
    if (!payload[field]) {
      return NextResponse.json({ error: `${label} is required.` }, { status: 400 });
    }
  }

  if (!EMAIL_PATTERN.test(payload.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const cartId = request.cookies.get(CART_COOKIE)?.value;
  if (!cartId) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const { data: cartRows, error: cartError } = await admin
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (cartError) {
    console.error("[checkout] failed to load cart:", cartError.message);
    return NextResponse.json({ error: "Unable to read your cart." }, { status: 500 });
  }

  const items = (cartRows ?? []) as CartItem[];
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const subtotalCents = items.reduce(
    (sum, item) => sum + (item.product?.price_cents ?? 0) * item.quantity,
    0
  );
  const shippingCents = 0; // Complimentary courier delivery on every order.
  const totalCents = subtotalCents + shippingCents;

  // Attach the order to the signed-in customer when there is one.
  const sessionClient = createSupabaseServerClient();
  const user = sessionClient ? (await sessionClient.auth.getUser()).data.user : null;

  const paystackReady = isPaystackConfigured();
  const orderReference = orderNumber();
  const reference = paystackReady ? paymentReference(orderReference) : null;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderReference,
      cart_id: cartId,
      payment_reference: reference,
      user_id: user?.id ?? null,
      email: payload.email,
      full_name: payload.fullName,
      phone: payload.phone,
      address_line1: payload.addressLine1,
      address_line2: payload.addressLine2 || null,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postalCode || null,
      country: payload.country,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      status: paystackReady ? "pending_payment" : "confirmed",
    })
    .select("*")
    .single();

  if (orderError || !order) {
    console.error("[checkout] failed to create order:", orderError?.message);
    return NextResponse.json({ error: "Unable to place your order." }, { status: 500 });
  }

  const lineItems = items.map((item) => ({
    order_id: order.id as string,
    product_id: item.product_id,
    product_name: item.product?.name ?? "SMS Garment",
    size_type: item.size_type,
    standard_size: item.standard_size,
    measurements: item.measurements,
    unit_price_cents: item.product?.price_cents ?? 0,
    quantity: item.quantity,
    line_total_cents: (item.product?.price_cents ?? 0) * item.quantity,
  }));

  const { data: insertedItems, error: itemsError } = await admin
    .from("order_items")
    .insert(lineItems)
    .select("*");

  if (itemsError) {
    console.error("[checkout] failed to create order items:", itemsError.message);
    return NextResponse.json({ error: "Unable to record your order items." }, { status: 500 });
  }

  // With Paystack configured the buyer pays first; the callback and webhook
  // settle the order, email the receipt and clear the cart.
  if (paystackReady && reference) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

    try {
      const transaction = await initializeTransaction({
        email: payload.email,
        amountKobo: totalCents,
        reference,
        callbackUrl: `${siteUrl.replace(/\/$/, "")}/api/paystack/callback`,
        metadata: {
          order_number: order.order_number,
          customer: payload.fullName,
          phone: payload.phone,
          shipping_address: {
            line1: payload.addressLine1,
            line2: payload.addressLine2 || null,
            city: payload.city,
            state: payload.state,
            postal_code: payload.postalCode || null,
            country: payload.country,
          },
          items: lineItems.map((line) => ({
            name: line.product_name,
            quantity: line.quantity,
            fit:
              line.size_type === "custom"
                ? "made-to-measure"
                : `off-the-rack ${line.standard_size ?? ""}`.trim(),
          })),
        },
      });

      return NextResponse.json({
        orderNumber: order.order_number as string,
        authorizationUrl: transaction.authorizationUrl,
        reference: transaction.reference,
      });
    } catch (error) {
      // Leave the order as failed rather than pending, so it is not mistaken
      // for an unpaid attempt in the books.
      await admin.from("orders").update({ status: "payment_failed" }).eq("id", order.id);
      console.error("[checkout] paystack initialise failed:", (error as Error).message);
      return NextResponse.json(
        { error: "We could not reach Paystack. Please try again in a moment." },
        { status: 502 }
      );
    }
  }

  const emailSent = await sendOrderConfirmationEmail(
    order as Order,
    (insertedItems ?? lineItems) as OrderItem[]
  );

  // The order is now durable — clear the cart.
  const { error: clearError } = await admin.from("cart_items").delete().eq("cart_id", cartId);
  if (clearError) {
    console.error("[checkout] failed to clear cart:", clearError.message);
  }

  return NextResponse.json({
    orderNumber: order.order_number as string,
    emailSent,
  });
}
