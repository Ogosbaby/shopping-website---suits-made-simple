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
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host");

  let siteUrl = "";
  if (forwardedHost) {
    siteUrl = `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  } else if (host && !host.includes("localhost")) {
    const proto = request.nextUrl.protocol.replace(":", "") || "https";
    siteUrl = `${proto}://${host}`.replace(/\/$/, "");
  } else if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    siteUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  } else {
    siteUrl = request.nextUrl.origin.replace(/\/$/, "");
  }

  const reference =
    request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref") ?? "";
  const isApp =
    request.nextUrl.searchParams.get("from") === "app" ||
    request.cookies.get("sms_is_app")?.value === "1";
  const appParam = isApp ? "&from=app" : "";

  if (!reference || !isPaystackConfigured()) {
    return NextResponse.redirect(`${siteUrl}/checkout/failed${isApp ? "?from=app" : ""}`);
  }

  try {
    const verified = await verifyTransaction(reference);

    if (!verified.paid) {
      return NextResponse.redirect(
        `${siteUrl}/checkout/failed?reference=${encodeURIComponent(reference)}${appParam}`
      );
    }

    const settlement = await settlePaidOrder(reference, verified.amountKobo);

    if (!settlement) {
      return NextResponse.redirect(
        `${siteUrl}/checkout/failed?reference=${encodeURIComponent(reference)}${appParam}`
      );
    }

    return NextResponse.redirect(
      `${siteUrl}/checkout/success?order=${encodeURIComponent(settlement.orderNumber)}` +
        `&email=${settlement.emailSent ? "1" : "0"}${appParam}`
    );
  } catch (error) {
    console.error("[paystack] callback failed:", (error as Error).message);
    return NextResponse.redirect(
      `${siteUrl}/checkout/failed?reference=${encodeURIComponent(reference)}${appParam}`
    );
  }
}
