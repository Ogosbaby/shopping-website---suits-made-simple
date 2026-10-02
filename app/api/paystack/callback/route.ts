import { NextRequest, NextResponse } from "next/server";
import { isPaystackConfigured, verifyTransaction } from "@/lib/paystack";
import { settlePaidOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/paystack/callback
 *
 * Paystack sends the buyer back here after the payment page. The transaction is
 * verified server-to-server before anything is marked paid — the query string
 * alone is never trusted.
 */
export async function GET(request: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  const reference =
    request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref") ?? "";

  if (!reference || !isPaystackConfigured()) {
    return NextResponse.redirect(`${siteUrl}/checkout/failed`);
  }

  try {
    const verified = await verifyTransaction(reference);

    if (!verified.paid) {
      return NextResponse.redirect(
        `${siteUrl}/checkout/failed?reference=${encodeURIComponent(reference)}`
      );
    }

    const settlement = await settlePaidOrder(reference, verified.amountKobo);

    if (!settlement) {
      return NextResponse.redirect(
        `${siteUrl}/checkout/failed?reference=${encodeURIComponent(reference)}`
      );
    }

    return NextResponse.redirect(
      `${siteUrl}/checkout/success?order=${encodeURIComponent(settlement.orderNumber)}` +
        `&email=${settlement.emailSent ? "1" : "0"}`
    );
  } catch (error) {
    console.error("[paystack] callback failed:", (error as Error).message);
    return NextResponse.redirect(
      `${siteUrl}/checkout/failed?reference=${encodeURIComponent(reference)}`
    );
  }
}
