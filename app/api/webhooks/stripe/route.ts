import { createClient } from "@supabase/supabase-js";
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

  // biome-ignore lint/suspicious/noImplicitAnyLet: don't know
  let event;
  try {
    // If we have a webhook secret, verify the signature
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } else {
      event = JSON.parse(body);
    }
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
        is_promoted?: boolean;
        promoted_until?: string;
        is_urgent?: boolean;
        boosted_until?: string;
      };

      const updateData: ListingUpdate = {
        status: "active",
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
      } else {
        console.log(
          `Activated ${promotionType} for listing ${listingId} until ${promotedUntil.toISOString()}`,
        );
      }
    }

    // ─── Dealer subscription checkout ──────────────────────────────────────
    if (session.metadata?.type === "dealer_subscription") {
      const userId = session.metadata.user_id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (userId && customerId) {
        // Upsert dealer_shops row
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
              plan_started_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

        // Flip is_dealer on profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ is_dealer: true })
          .eq("id", userId);

        if (shopError)
          console.error("Failed to upsert dealer shop:", shopError);
        if (profileError)
          console.error("Failed to update dealer profile:", profileError);
        else console.log(`Activated dealer subscription for user ${userId}`);
      }
    }
  }

  // ─── Subscription lifecycle events ──────────────────────────────────────
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;

    if (userId && subscription.metadata?.type === "dealer_subscription") {
      const isActive =
        subscription.status === "active" || subscription.status === "trialing";

      await supabaseAdmin
        .from("dealer_shops")
        .update({
          plan_status: isActive
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : "cancelled",
          plan_expires_at: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        })
        .eq("user_id", userId);

      await supabaseAdmin
        .from("profiles")
        .update({ is_dealer: isActive })
        .eq("id", userId);

      console.log(
        `Dealer subscription ${event.type} for user ${userId}: ${subscription.status}`,
      );
    }
  }

  return NextResponse.json({ received: true });
}
