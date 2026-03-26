import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MASTER_PROMO_CODE = "NEXTBAZAR";

// Service role — bypasses RLS
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

    // Validate the promo code (case-insensitive)
    const normalised = code.trim().toUpperCase();

    // ── TEMP DEBUG — remove after confirming fix ──
    console.log("REDEEM DEBUG:", JSON.stringify({
      raw: code,
      normalised,
      expected: MASTER_PROMO_CODE,
      rawLen: code.length,
      normLen: normalised.length,
      expLen: MASTER_PROMO_CODE.length,
      match: normalised === MASTER_PROMO_CODE,
      charCodes: [...normalised].map((c) => c.charCodeAt(0)),
    }));

    if (normalised !== MASTER_PROMO_CODE) {
      return NextResponse.json(
        {
          error: "Invalid promo code",
          // TEMP: include debug in response so we can see in network tab
          _debug: {
            received: normalised,
            expected: MASTER_PROMO_CODE,
            rawLen: code.length,
            normLen: normalised.length,
            match: normalised === MASTER_PROMO_CODE,
          },
        },
        { status: 404 },
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
