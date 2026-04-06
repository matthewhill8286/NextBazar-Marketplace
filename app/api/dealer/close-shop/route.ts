import { createClient as createAdminClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth/require-auth";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(_request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { userId } = auth;

    // Fetch the shop
    const { data: shop } = await supabaseAdmin
      .from("dealer_shops")
      .select("id, plan_status, stripe_subscription_id, stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    if (shop.plan_status === "closed") {
      return NextResponse.json(
        { error: "Shop is already closed" },
        { status: 409 },
      );
    }

    // Cancel Stripe subscription if one exists
    if (shop.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(shop.stripe_subscription_id);
      } catch (stripeErr) {
        // If subscription is already cancelled/doesn't exist, that's fine
        console.warn("Stripe cancellation warning:", stripeErr);
      }
    }

    // Set plan_status to "closed"
    const { error: updateError } = await supabaseAdmin
      .from("dealer_shops")
      .update({
        plan_status: "closed",
        plan_expires_at: new Date().toISOString(),
      })
      .eq("id", shop.id);

    if (updateError) {
      console.error("Failed to close shop:", updateError);
      return NextResponse.json(
        { error: "Failed to close shop" },
        { status: 500 },
      );
    }

    // Remove is_pro_seller flag from profile
    await supabaseAdmin
      .from("profiles")
      .update({ is_pro_seller: false })
      .eq("id", userId);

    // Deactivate all the user's active listings
    await supabaseAdmin
      .from("listings")
      .update({ status: "inactive" })
      .eq("user_id", userId)
      .eq("status", "active");

    return NextResponse.json({
      success: true,
      message: "Your shop has been closed.",
    });
  } catch (err: unknown) {
    console.error("Close shop error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to close shop",
      },
      { status: 500 },
    );
  }
}
