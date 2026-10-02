import { NextRequest, NextResponse } from "next/server";
import { isPaystackConfigured, verifyWebhookSignature } from "@/lib/paystack";
import { settlePaidOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * POST /api/paystack/webhook
 *
 * Paystack's authoritative notification. It fires even when the buyer closes
 * the tab before being redirected back, so it — not the callback — is what
 * guarantees a paid order is recorded. Settlement is idempotent.
 *
 * Point the Paystack dashboard webhook URL at this route.
 */
export async function POST(request: NextRequest) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: "Paystack is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; amount?: number } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (typeof reference === "string" && reference) {
      const settlement = await settlePaidOrder(reference, Number(event.data?.amount ?? 0));
      console.log(
        `[paystack] webhook charge.success ${reference} →`,
        settlement ? (settlement.alreadySettled ? "already settled" : "settled") : "order not found"
      );
    }
  }

  // Paystack only needs an acknowledgement.
  return NextResponse.json({ received: true });
}
