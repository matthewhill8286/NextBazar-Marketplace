import { type NextRequest, NextResponse } from "next/server";
import { getDealerPlan, stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { origin } = await request.json();
    if (!origin) {
      return NextResponse.json({ error: "Missing origin" }, { status: 400 });
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
      .select("stripe_customer_id, plan_status")
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

    // Fetch dealer plan pricing from DB
    const dealerPlan = await getDealerPlan();

    // Resolve the price ID — if set in DB, use it; otherwise create the
    // product+price on the fly (useful for dev/test environments).
    let priceId = dealerPlan.priceId;
    if (!priceId) {
      const product = await stripe.products.create({
        name: dealerPlan.name,
        description: dealerPlan.description,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: dealerPlan.amount,
        currency: "eur",
        recurring: { interval: dealerPlan.interval },
      });
      priceId = price.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/shop-onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro-sellers`,
      metadata: {
        user_id: user.id,
        type: "dealer_subscription",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          type: "dealer_subscription",
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
