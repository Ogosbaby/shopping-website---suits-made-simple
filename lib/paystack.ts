import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack — card, bank transfer and USSD payments in NGN.
 *
 * Amounts are always sent in the minor unit (kobo), which is exactly how the
 * store already stores money, so no conversion is involved.
 */

const BASE_URL = "https://api.paystack.co";

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data?: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<PaystackEnvelope<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let payload: PaystackEnvelope<T>;
  try {
    payload = (await response.json()) as PaystackEnvelope<T>;
  } catch {
    throw new Error(`Paystack returned an unreadable response (HTTP ${response.status}).`);
  }

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || `Paystack request failed (HTTP ${response.status}).`);
  }

  return payload;
}

export interface InitializeInput {
  email: string;
  /** Total in kobo. */
  amountKobo: number;
  /** Unique per attempt; also stored on the order so payment can be matched back. */
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export async function initializeTransaction(input: InitializeInput): Promise<InitializeResult> {
  const { data } = await request<{
    authorization_url: string;
    reference: string;
    access_code: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    }),
  });

  if (!data?.authorization_url) {
    throw new Error("Paystack did not return a checkout URL.");
  }

  return {
    authorizationUrl: data.authorization_url,
    reference: data.reference ?? input.reference,
    accessCode: data.access_code ?? "",
  };
}

export interface VerifyResult {
  paid: boolean;
  /** Amount actually received, in kobo. */
  amountKobo: number;
  reference: string;
  currency: string;
  channel: string | null;
  gatewayResponse: string | null;
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const { data } = await request<{
    status: string;
    amount: number;
    reference: string;
    currency: string;
    channel: string | null;
    gateway_response: string | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  return {
    paid: data?.status === "success",
    amountKobo: Number(data?.amount ?? 0),
    reference: data?.reference ?? reference,
    currency: data?.currency ?? "NGN",
    channel: data?.channel ?? null,
    gatewayResponse: data?.gateway_response ?? null,
  };
}

/**
 * Paystack signs the raw request body with HMAC-SHA512 using the secret key.
 * The comparison is constant-time to avoid leaking the signature.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = createHmac("sha512", secretKey()).update(rawBody, "utf8").digest("hex");
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");

  if (received.length !== computed.length) return false;
  return timingSafeEqual(received, computed);
}

/** A short, unique-enough reference that still reads like the order number. */
export function paymentReference(orderNumber: string): string {
  return `${orderNumber}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
