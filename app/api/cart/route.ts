import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { MEASUREMENT_FIELDS, type CartItem, type Measurements, type SizeType } from "@/types";

/**
 * Cart API — every mutation is persisted to the `cart_items` table.
 *
 * A cart is scoped in one of two ways:
 *  - Signed out: keyed by a long-lived `sms_cart_id` cookie, so guests keep
 *    their cart across visits.
 *  - Signed in: keyed by `user_id`, so the very same cart follows the shopper
 *    to any device (browser, mobile app, tablet). Guest lines created on the
 *    current device are adopted into the account on first use.
 */

const CART_COOKIE = "sms_cart_id";
const MAX_QUANTITY = 20;

const cartCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 60, // 60 days
};

type SupabaseClient = NonNullable<
  ReturnType<typeof createSupabaseAdminClient> | ReturnType<typeof createSupabaseServerClient>
>;

function pickClient(): SupabaseClient | null {
  return createSupabaseAdminClient() ?? createSupabaseServerClient();
}

/** The signed-in shopper's id, or null for guests / unconfigured projects. */
async function getCurrentUserId(): Promise<string | null> {
  const serverClient = createSupabaseServerClient();
  if (!serverClient) return null;

  try {
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

interface CartScope {
  /** Cookie-based cart id for guests (also the id new lines are filed under). */
  cartId: string;
  /** Signed-in shopper, whose account owns the cart across devices. */
  userId: string | null;
  /** Whether the response should hand the browser a fresh cart cookie. */
  isNew: boolean;
}

async function resolveCart(request: NextRequest, client: SupabaseClient): Promise<CartScope> {
  const cookieCartId = request.cookies.get(CART_COOKIE)?.value ?? null;
  const userId = await getCurrentUserId();
  const cartId = cookieCartId ?? crypto.randomUUID();
  const isNew = !cookieCartId;

  // Once a shopper signs in, adopt any guest lines this device created so
  // nothing is stranded behind the anonymous cookie.
  if (userId && cookieCartId) {
    await client
      .from("cart_items")
      .update({ user_id: userId })
      .eq("cart_id", cartId)
      .is("user_id", null);
  }

  return { cartId, userId, isNew };
}

function withCartCookie(response: NextResponse, cartId: string): NextResponse {
  response.cookies.set(CART_COOKIE, cartId, cartCookieOptions);
  return response;
}

function normalizeMeasurements(raw: unknown): Measurements | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const result = {} as Measurements;

  for (const { key } of MEASUREMENT_FIELDS) {
    const value = Number(source[key]);
    if (!Number.isFinite(value) || value <= 0 || value > 80) return null;
    result[key] = String(value);
  }

  return result;
}

function parseQuantity(raw: unknown): number {
  const quantity = Math.floor(Number(raw));
  if (!Number.isFinite(quantity) || quantity < 1) return 1;
  return Math.min(quantity, MAX_QUANTITY);
}

/** GET /api/cart — returns the current cart with product details. */
export async function GET(request: NextRequest) {
  const client = pickClient();
  if (!client) {
    return NextResponse.json({ items: [], configured: false });
  }

  const { cartId, userId, isNew } = await resolveCart(request, client);

  // Signed-in shoppers read every line owned by their account (across every
  // device); guests read only the lines filed under their cookie.
  const scoped = client.from("cart_items").select("*, product:products(*)");
  const { data, error } = await (userId
    ? scoped.eq("user_id", userId)
    : scoped.eq("cart_id", cartId)
  ).order("created_at", { ascending: true });

  if (error) {
    console.error("[cart] failed to load cart:", error.message);
    return NextResponse.json({ error: "Unable to load your cart." }, { status: 500 });
  }

  const response = NextResponse.json({
    items: (data ?? []) as CartItem[],
    configured: true,
  });

  return isNew ? withCartCookie(response, cartId) : response;
}

/** POST /api/cart — adds an item (standard sizing or custom tailoring). */
export async function POST(request: NextRequest) {
  const client = pickClient();
  if (!client) {
    return NextResponse.json(
      { error: "The store is not connected to its database yet." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const sizeType = body.sizeType === "custom" ? "custom" : body.sizeType === "standard" ? "standard" : null;
  const quantity = parseQuantity(body.quantity ?? 1);
  const standardSize = typeof body.standardSize === "string" ? body.standardSize : null;
  const measurements = sizeType === "custom" ? normalizeMeasurements(body.measurements) : null;

  if (!productId) {
    return NextResponse.json({ error: "A product is required." }, { status: 400 });
  }
  if (!sizeType) {
    return NextResponse.json({ error: "Choose a sizing method." }, { status: 400 });
  }
  if (sizeType === "standard" && !standardSize) {
    return NextResponse.json({ error: "Select an off-the-rack size." }, { status: 400 });
  }
  if (sizeType === "custom" && !measurements) {
    return NextResponse.json(
      { error: "All six measurements are required for custom tailoring." },
      { status: 400 }
    );
  }

  const { data: product, error: productError } = await client
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ error: "That product could not be found." }, { status: 404 });
  }

  let variantId: string | null = null;
  if (sizeType === "standard") {
    const { data: variant } = await client
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .eq("size", standardSize)
      .maybeSingle();

    if (!variant) {
      return NextResponse.json(
        { error: `Size ${standardSize} is currently unavailable for this piece.` },
        { status: 400 }
      );
    }
    variantId = variant.id as string;
  }

  const { cartId, userId, isNew } = await resolveCart(request, client);

  // Merge with an identical line when one already exists in this cart.
  const existingScoped = client
    .from("cart_items")
    .select("id, quantity, size_type, standard_size, measurements")
    .eq("product_id", productId)
    .eq("size_type", sizeType);
  const { data: existingRows } = await (userId
    ? existingScoped.eq("user_id", userId)
    : existingScoped.eq("cart_id", cartId)
  );

  const match = (existingRows ?? []).find((row) =>
    sizeType === "standard"
      ? row.standard_size === standardSize
      : JSON.stringify(row.measurements ?? {}) === JSON.stringify(measurements)
  );

  if (match) {
    const { data: updated, error: updateError } = await client
      .from("cart_items")
      .update({ quantity: Math.min(Number(match.quantity) + quantity, MAX_QUANTITY) })
      .eq("id", match.id)
      .select("*, product:products(*)")
      .single();

    if (updateError) {
      console.error("[cart] failed to merge cart item:", updateError.message);
      return NextResponse.json({ error: "Unable to update your cart." }, { status: 500 });
    }

    const response = NextResponse.json({ item: updated as CartItem, merged: true });
    return isNew ? withCartCookie(response, cartId) : response;
  }

  const { data: inserted, error: insertError } = await client
    .from("cart_items")
    .insert({
      cart_id: cartId,
      user_id: userId,
      product_id: productId,
      variant_id: variantId,
      size_type: sizeType satisfies SizeType,
      standard_size: sizeType === "standard" ? standardSize : null,
      measurements: sizeType === "custom" ? measurements : null,
      quantity,
    })
    .select("*, product:products(*)")
    .single();

  if (insertError) {
    console.error("[cart] failed to add cart item:", insertError.message);
    return NextResponse.json({ error: "Unable to add that to your cart." }, { status: 500 });
  }

  const response = NextResponse.json({ item: inserted as CartItem }, { status: 201 });
  return isNew ? withCartCookie(response, cartId) : response;
}

/** PATCH /api/cart — updates the quantity of a cart line. */
export async function PATCH(request: NextRequest) {
  const client = pickClient();
  if (!client) {
    return NextResponse.json({ error: "The store is not connected to its database yet." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const quantity = parseQuantity(body.quantity);

  if (!itemId) {
    return NextResponse.json({ error: "A cart item is required." }, { status: 400 });
  }

  const { cartId, userId } = await resolveCart(request, client);
  if (!userId && !request.cookies.get(CART_COOKIE)?.value) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 404 });
  }

  const scoped = client.from("cart_items").update({ quantity }).eq("id", itemId);
  const { data: updated, error } = await (userId
    ? scoped.eq("user_id", userId)
    : scoped.eq("cart_id", cartId)
  )
    .select("*, product:products(*)")
    .maybeSingle();

  if (error) {
    console.error("[cart] failed to update cart item:", error.message);
    return NextResponse.json({ error: "Unable to update your cart." }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "That cart item no longer exists." }, { status: 404 });
  }

  return NextResponse.json({ item: updated as CartItem });
}

/** DELETE /api/cart?itemId=… or ?itemId=all — removes a line or empties the cart. */
export async function DELETE(request: NextRequest) {
  const client = pickClient();
  if (!client) {
    return NextResponse.json({ error: "The store is not connected to its database yet." }, { status: 503 });
  }

  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "A cart item is required." }, { status: 400 });
  }

  const { cartId, userId } = await resolveCart(request, client);
  if (!userId && !request.cookies.get(CART_COOKIE)?.value) {
    return NextResponse.json({ removed: 0 });
  }

  const scoped = client.from("cart_items").delete();
  const scopedById = userId ? scoped.eq("user_id", userId) : scoped.eq("cart_id", cartId);
  const query = itemId === "all" ? scopedById : scopedById.eq("id", itemId);

  const { error } = await query;

  if (error) {
    console.error("[cart] failed to remove cart item:", error.message);
    return NextResponse.json({ error: "Unable to update your cart." }, { status: 500 });
  }

  return NextResponse.json({ removed: itemId === "all" ? "all" : 1 });
}
