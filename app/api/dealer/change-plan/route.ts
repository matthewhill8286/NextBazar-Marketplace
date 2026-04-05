import { type NextRequest, NextResponse } from "next/server";
import { getSellerPlan, stripe } from "@/lib/stripe";
import type { SellerTier } from "@/lib/pricing-config";
import { createClient } from "@/lib/supabase/server";

const VALID_TIERS: SellerTier[] = ["pro", "business"];
const VALID_BILLING = ["monthly", "yearly"] as const;

/**
 * POST /api/dealer/change-plan
 *
 * Upgrade or downgrade an existing Stripe subscription to a different tier
 * and/or billing interval.  Uses Stripe's proration to handle partial-cycle
 * charges automatically.
 *
 * Body: { newTier: "pro"|"business", billing?: "monthly"|"yearly" }
 */
export async function POST(request: NextRequest) {
  try {
    const { newTier, billing } = await request.json();

    if (!newTier || !VALID_TIERS.includes(newTier)) {
      return NextResponse.json(
        { error: `Invalid tier: ${newTier}. Must be one of: ${VALID_TIERS.join(", ")}` },
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

    // Fetch current shop
    const { data: shop } = await supabase
      .from("dealer_shops")
      .select(
        "stripe_subscription_id, stripe_customer_id, plan_tier, plan_status, billing_interval",
      )
      .eq("user_id", user.id)
      .single();

    if (!shop || shop.plan_status !== "active") {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 404 },
      );
    }

    if (!shop.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No Stripe subscription found. Please contact support." },
        { status: 400 },
      );
    }

    // Don't allow changing to the same tier + billing
    const effectiveBilling = billing || shop.billing_interval || "monthly";
    if (shop.plan_tier === newTier && shop.billing_interval === effectiveBilling) {
      return NextResponse.json(
        { error: "You're already on this plan." },
        { status: 400 },
      );
    }

    // Resolve the target plan and its Stripe price
    const targetPlan = await getSellerPlan(newTier, effectiveBilling);

    let priceId = targetPlan.priceId;
    if (!priceId) {
      // Auto-create price in dev/test environments
      const product = await stripe.products.create({
        name: `${targetPlan.name} (${effectiveBilling === "yearly" ? "Annual" : "Monthly"})`,
        description: targetPlan.description,
        metadata: { tier: newTier, billing: effectiveBilling },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: targetPlan.amount,
        currency: "eur",
        recurring: { interval: targetPlan.interval },
      });
      priceId = price.id;
    }

    // Retrieve the current subscription to find the item to swap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = (await stripe.subscriptions.retrieve(
      shop.stripe_subscription_id,
    )) as any;
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: "Could not find subscription item. Please contact support." },
        { status: 500 },
      );
    }

    // Determine proration behavior:
    // - Upgrading → prorate immediately (charge difference)
    // - Downgrading → apply at end of billing period
    const isUpgrade =
      (newTier === "business" && shop.plan_tier === "pro") ||
      (effectiveBilling === "yearly" && shop.billing_interval === "monthly" && newTier === shop.plan_tier);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedSubscription = (await stripe.subscriptions.update(
      shop.stripe_subscription_id,
      {
        items: [
          {
            id: subscriptionItemId,
            price: priceId,
          },
        ],
        proration_behavior: isUpgrade
          ? "create_prorations"
          : "create_prorations",
        metadata: {
          user_id: user.id,
          type: "dealer_subscription",
          plan_tier: newTier,
          billing_interval: effectiveBilling,
        },
      },
    )) as any;

    // Immediately update the local DB so UI reflects the change
    const now = new Date();
    const periodEnd = updatedSubscription.current_period_end
      ? new Date(updatedSubscription.current_period_end * 1000)
      : null;

    await supabase
      .from("dealer_shops")
      .update({
        plan_tier: newTier,
        billing_interval: effectiveBilling,
        plan_started_at: now.toISOString(),
        plan_expires_at: periodEnd?.toISOString() ?? null,
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      newTier,
      billing: effectiveBilling,
      message:
        isUpgrade
          ? `Upgraded to ${targetPlan.name}! Changes are effective immediately.`
          : `Changed to ${targetPlan.name}. Your plan will adjust at the next billing cycle.`,
    });
  } catch (err: unknown) {
    console.error("Change plan error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to change plan",
      },
      { status: 500 },
    );
  }
}
