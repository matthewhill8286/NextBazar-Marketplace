import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * Reopen a closed shop. Only works for shops that were closed via promo code
 * (no Stripe subscription). For Stripe-subscribed shops, the user needs to
 * re-subscribe through the normal subscribe flow.
 */
export async function POST(_request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { userId } = auth;

    const { data: shop } = await supabaseAdmin
      .from("dealer_shops")
      .select("id, plan_status, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    if (shop.plan_status === "active") {
      return NextResponse.json(
        { error: "Shop is already active" },
        { status: 409 },
      );
    }

    if (shop.plan_status !== "closed") {
      return NextResponse.json(
        { error: "Shop cannot be reopened in its current state" },
        { status: 400 },
      );
    }

    // If there was a Stripe subscription, they need to re-subscribe
    if (shop.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: "re-subscribe required",
          message:
            "Your previous subscription was cancelled. Please subscribe again to reopen your shop.",
          requiresSubscription: true,
        },
        { status: 402 },
      );
    }

    // Promo-code shops: reactivate for another month
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error: updateError } = await supabaseAdmin
      .from("dealer_shops")
      .update({
        plan_status: "active",
        plan_started_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("id", shop.id);

    if (updateError) {
      console.error("Failed to reopen shop:", updateError);
      return NextResponse.json(
        { error: "Failed to reopen shop" },
        { status: 500 },
      );
    }

    // Restore is_pro_seller flag
    await supabaseAdmin
      .from("profiles")
      .update({ is_pro_seller: true })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message: "Your shop is back open!",
      expires_at: expiresAt.toISOString(),
    });
  } catch (err: unknown) {
    console.error("Reopen shop error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to reopen shop",
      },
      { status: 500 },
    );
  }
}
