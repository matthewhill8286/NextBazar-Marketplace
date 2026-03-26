import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Service role — bypasses RLS on promo_codes table
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 },
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user already has an active Pro Seller subscription
    const { data: existingShop } = await supabaseAdmin
      .from("dealer_shops")
      .select("plan_status")
      .eq("user_id", user.id)
      .single();

    if (existingShop?.plan_status === "active") {
      return NextResponse.json(
        { error: "You already have an active Pro Seller subscription" },
        { status: 409 },
      );
    }

    // Look up the code (case-insensitive)
    const normalised = code.trim().toUpperCase();
    const { data: promoCode, error: lookupError } = await supabaseAdmin
      .from("promo_codes")
      .select("id, code, redeemed_by")
      .eq("code", normalised)
      .single();

    if (lookupError || !promoCode) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 404 },
      );
    }

    if (promoCode.redeemed_by) {
      return NextResponse.json(
        { error: "This code has already been used" },
        { status: 410 },
      );
    }

    // ── Redeem: mark code as used ──────────────────────────────────────────
    const { error: redeemError } = await supabaseAdmin
      .from("promo_codes")
      .update({
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", promoCode.id)
      .is("redeemed_by", null); // Prevent race condition

    if (redeemError) {
      console.error("Failed to redeem promo code:", redeemError);
      return NextResponse.json(
        { error: "Failed to redeem code" },
        { status: 500 },
      );
    }

    // ── Activate Pro Seller for 1 month ────────────────────────────────────
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error: shopError } = await supabaseAdmin
      .from("dealer_shops")
      .upsert(
        {
          user_id: user.id,
          shop_name: "My Shop",
          slug: user.id.slice(0, 8),
          plan_status: "active",
          plan_started_at: now.toISOString(),
          plan_expires_at: expiresAt.toISOString(),
          // No Stripe IDs — this is a free promo activation
        },
        { onConflict: "user_id" },
      );

    if (shopError) {
      console.error("Failed to create dealer shop:", shopError);
      return NextResponse.json(
        { error: "Failed to activate Pro Seller" },
        { status: 500 },
      );
    }

    // Flip is_pro_seller on profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_pro_seller: true })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update dealer profile:", profileError);
    }

    return NextResponse.json({
      success: true,
      message: "Pro Seller activated for 1 month!",
      expires_at: expiresAt.toISOString(),
    });
  } catch (err: unknown) {
    console.error("Redeem code error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to redeem promo code",
      },
      { status: 500 },
    );
  }
}
