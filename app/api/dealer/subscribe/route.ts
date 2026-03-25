import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEALER_PLAN, stripe } from "@/lib/stripe";

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

    // Resolve the price ID — if env var is set, use it; otherwise create the
    // product+price on the fly (useful for dev/test environments).
    let priceId = DEALER_PLAN.priceId;
    if (!priceId) {
      const product = await stripe.products.create({
        name: DEALER_PLAN.name,
        description: DEALER_PLAN.description,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: DEALER_PLAN.amount,
        currency: "eur",
        recurring: { interval: DEALER_PLAN.interval },
      });
      priceId = price.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?view=my-shop&setup=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?view=my-shop`,
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
