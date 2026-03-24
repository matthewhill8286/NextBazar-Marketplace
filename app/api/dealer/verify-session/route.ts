import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/dealer/verify-session
 *
 * Called when the user lands back on /dashboard/dealer?setup=true after Stripe
 * Checkout. Verifies the Checkout Session is paid, then provisions the
 * dealer_shops row + flips is_dealer if the webhook hasn't done so yet.
 *
 * This avoids the race condition where the redirect beats the webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 },
      );
    }

    // Authenticate the requesting user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve the Checkout Session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Safety checks
    if (session.metadata?.type !== "dealer_subscription") {
      return NextResponse.json(
        { error: "Not a dealer session" },
        { status: 400 },
      );
    }
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { error: "Session does not belong to you" },
        { status: 403 },
      );
    }
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 402 },
      );
    }

    // Use service role to bypass RLS (same as webhook)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as { id: string } | null)?.id ?? null;

    // Check if shop already exists (webhook might have already handled it)
    const { data: existingShop } = await supabaseAdmin
      .from("dealer_shops")
      .select("id, plan_status")
      .eq("user_id", user.id)
      .single();

    if (existingShop?.plan_status === "active") {
      // Webhook already provisioned — nothing to do
      return NextResponse.json({ status: "already_active" });
    }

    // Provision the shop (upsert so it's safe if webhook fires concurrently)
    const { error: shopError } = await supabaseAdmin
      .from("dealer_shops")
      .upsert(
        {
          user_id: user.id,
          shop_name: "My Shop",
          slug: user.id.slice(0, 8),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_status: "active",
          plan_started_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (shopError) {
      console.error("verify-session: Failed to upsert dealer shop:", shopError);
      return NextResponse.json(
        { error: "Failed to provision shop" },
        { status: 500 },
      );
    }

    // Flip is_dealer on profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_dealer: true })
      .eq("id", user.id);

    if (profileError) {
      console.error("verify-session: Failed to update profile:", profileError);
    }

    return NextResponse.json({ status: "activated" });
  } catch (err: unknown) {
    console.error("verify-session error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to verify session",
      },
      { status: 500 },
    );
  }
}
