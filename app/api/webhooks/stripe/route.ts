import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Use service role for webhook — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  // biome-ignore lint/suspicious/noImplicitAnyLet: Stripe event type
  let event;
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    // In production, ALWAYS verify the signature. Reject if secret is missing.
    if (!secret) {
      console.error(
        "STRIPE_WEBHOOK_SECRET is not set — rejecting webhook payload.",
      );
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ─── Listing promotion checkout ──────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const listingId = session.metadata?.listing_id;
    const promotionType = session.metadata?.promotion_type;
    const durationDays = parseInt(session.metadata?.duration_days || "7", 10);

    if (listingId && promotionType) {
      const promotedUntil = new Date();
      promotedUntil.setDate(promotedUntil.getDate() + durationDays);

      type ListingUpdate = {
        status: string;
        promoted_at?: string;
        is_promoted?: boolean;
        promoted_until?: string;
        is_urgent?: boolean;
        boosted_until?: string;
      };

      const updateData: ListingUpdate = {
        status: "active",
        promoted_at: new Date().toISOString(),
      };

      if (promotionType === "featured") {
        updateData.is_promoted = true;
        updateData.promoted_until = promotedUntil.toISOString();
      } else if (promotionType === "urgent") {
        updateData.is_urgent = true;
        updateData.boosted_until = promotedUntil.toISOString();
      }

      const { error } = await supabaseAdmin
        .from("listings")
        .update(updateData)
        .eq("id", listingId);

      if (error) {
        console.error("Failed to activate promotion:", error);
      }
    }

    // ─── Dealer subscription checkout ──────────────────────────────────────
    if (session.metadata?.type === "dealer_subscription") {
      const userId = session.metadata.user_id;
      const planTier = session.metadata.plan_tier || "pro";
      const billingInterval = session.metadata.billing_interval || "monthly";
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (userId && customerId) {
        // Upsert dealer_shops row with plan tier info
        const { error: shopError } = await supabaseAdmin
          .from("dealer_shops")
          .upsert(
            {
              user_id: userId,
              shop_name: "My Shop",
              slug: userId.slice(0, 8),
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId ?? null,
              plan_status: "active",
              plan_tier: planTier,
              billing_interval: billingInterval,
              plan_started_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

        // Flip is_pro_seller on profile (any paid plan counts as "pro")
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ is_pro_seller: true })
          .eq("id", userId);

        if (shopError)
          console.error("Failed to upsert dealer shop:", shopError);
        if (profileError)
          console.error("Failed to update dealer profile:", profileError);

        // Bust public shop page cache
        revalidateTag("dealer_shops", "max");
      }
    }
  }

  // ─── Subscription lifecycle events ──────────────────────────────────────
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = event.data.object as any;
    const userId = subscription.metadata?.user_id;

    if (userId && subscription.metadata?.type === "dealer_subscription") {
      const isActive =
        subscription.status === "active" || subscription.status === "trialing";

      // Build the update payload — always update status + expiry
      const updatePayload: Record<string, unknown> = {
        plan_status: isActive
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : "cancelled",
        plan_expires_at: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      };

      // If the subscription metadata has tier info, update it (handles upgrades)
      if (subscription.metadata?.plan_tier) {
        updatePayload.plan_tier = subscription.metadata.plan_tier;
      }
      if (subscription.metadata?.billing_interval) {
        updatePayload.billing_interval = subscription.metadata.billing_interval;
      }

      // On cancellation, revert to starter tier
      if (!isActive && subscription.status !== "past_due") {
        updatePayload.plan_tier = "starter";
      }

      await supabaseAdmin
        .from("dealer_shops")
        .update(updatePayload)
        .eq("user_id", userId);

      await supabaseAdmin
        .from("profiles")
        .update({ is_pro_seller: isActive })
        .eq("id", userId);

      // Bust public shop page cache
      revalidateTag("dealer_shops", "max");
    }
  }

  return NextResponse.json({ received: true });
}
