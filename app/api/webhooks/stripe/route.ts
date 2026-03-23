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
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const listingId = session.metadata?.listing_id;
    const promotionType = session.metadata?.promotion_type;
    const durationDays = parseInt(session.metadata?.duration_days || "7", 10);

    if (listingId && promotionType) {
      const promotedUntil = new Date();
      promotedUntil.setDate(promotedUntil.getDate() + durationDays);

      const updateData: Record<string, any> = {};

      if (promotionType === "featured") {
        updateData.is_promoted = true;
        updateData.promoted_until = promotedUntil.toISOString();
      } else if (promotionType === "urgent") {
        updateData.is_urgent = true;
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
  }

  return NextResponse.json({ received: true });
}
