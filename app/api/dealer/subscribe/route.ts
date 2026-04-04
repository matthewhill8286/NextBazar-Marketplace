import { type NextRequest, NextResponse } from "next/server";
import { getSellerPlan, stripe } from "@/lib/stripe";
import type { SellerTier } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/server";

// Only seller tiers are allowed — Buyer+ plans are not yet launched.
// This prevents API-level activation of buyer plans even if the UI is manipulated.
const VALID_TIERS: SellerTier[] = ["pro", "business"];
const VALID_BILLING = ["monthly", "yearly"] as const;

export async function POST(request: NextRequest) {
  try {
    const {
      origin,
      tier = "pro",
      billing = "monthly",
    } = await request.json();

    if (!origin) {
      return NextResponse.json({ error: "Missing origin" }, { status: 400 });
    }
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier: ${tier}. Must be one of: ${VALID_TIERS.join(", ")}` },
        { status: 400 },
      );
    }
    if (!VALID_BILLING.includes(billing)) {
      return NextResponse.json(
        { error: `Invalid billing: ${billing}. Must be monthly or yearly` },
        { status: 400 },
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if they already have an active shop
    const { data: existingShop } = await supabase
      .from("dealer_shops")
      .select("stripe_customer_id, plan_status, plan_tier, shop_name, slug")
      .eq("user_id", user.id)
      .single();

    // Reuse existing Stripe customer or create a new one
    let customerId = existingShop?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    // Fetch the requested plan from DB
    const plan = await getSellerPlan(tier, billing);

    // Resolve the price ID — if set in DB, use it; otherwise create the
    // product+price on the fly (useful for dev/test environments).
    let priceId = plan.priceId;
    if (!priceId) {
      const product = await stripe.products.create({
        name: `${plan.name} (${billing === "yearly" ? "Annual" : "Monthly"})`,
        description: plan.description,
        metadata: { tier, billing },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: "eur",
        recurring: { interval: plan.interval },
      });
      priceId = price.id;
    }

    // If the user already has a configured shop (upgrading), skip onboarding
    // and send them straight to their dashboard with a success indicator.
    // A shop is "configured" if it has a shop_name set (i.e. they completed
    // onboarding at least once, even if currently on starter/free tier).
    const hasExistingShop = !!existingShop?.shop_name;
    const successUrl = hasExistingShop
      ? `${origin}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/shop-onboarding?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        type: "dealer_subscription",
        plan_tier: tier,
        billing_interval: billing,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          type: "dealer_subscription",
          plan_tier: tier,
          billing_interval: billing,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Dealer subscribe error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to create checkout",
      },
      { status: 500 },
    );
  }
}
