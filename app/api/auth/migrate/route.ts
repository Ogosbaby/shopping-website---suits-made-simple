import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdminClient();
  const serverClient = createSupabaseServerClient();
  if (!admin || !serverClient) {
    return NextResponse.json(
      { error: "Migration unavailable: Supabase not configured." },
      { status: 503 }
    );
  }

  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Migration requires authentication." },
      { status: 401 }
    );
  }

  // Get the guest cart ID from the sms_cart_id cookie
  const cartId = request.cookies.get("sms_cart_id")?.value;
  if (!cartId) {
    return NextResponse.json(
      { message: "No guest cart found to migrate." },
      { status: 200 }
    );
  }

  // Update cart items to associate with the logged-in user
  const { data: updatedItems, error } = await admin
    .from("cart_items")
    .update({ user_id: user.id })
    .eq("cart_id", cartId)
    .eq("user_id", null)
    .select("*, product:products(*)");

  if (error) {
    console.error("[auth/migrate] failed to migrate cart:", error.message);
    return NextResponse.json(
      { error: "Failed to migrate guest cart." },
      { status: 500 }
    );
  }

  // Clear the guest cart cookie by setting it to empty with past expiration
  const response = NextResponse.json(
    { message: "Guest cart migrated successfully.", migrated: updatedItems?.length ?? 0 },
    { status: 200 }
  );
  response.cookies.set("sms_cart_id", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}