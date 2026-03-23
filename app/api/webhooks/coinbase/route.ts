import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

// Service role client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("x-cc-webhook-signature");

  // Verify Coinbase Commerce webhook signature
  if (process.env.COINBASE_COMMERCE_WEBHOOK_SECRET) {
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    const hmac = createHmac(
      "sha256",
      process.env.COINBASE_COMMERCE_WEBHOOK_SECRET,
    )
      .update(body)
      .digest("hex");
    if (hmac !== sig) {
      console.error("Coinbase webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event?.type;

  // charge:confirmed = at least one payment confirmed on-chain
  // charge:completed = payment fully confirmed (recommended for activation)
  if (eventType === "charge:confirmed" || eventType === "charge:completed") {
    const charge = event.event?.data;
    const { listing_id, promotion_type, duration_days } =
      charge?.metadata || {};

    if (listing_id && promotion_type) {
      const durationDays = parseInt(duration_days || "7", 10);
      const promotedUntil = new Date();
      promotedUntil.setDate(promotedUntil.getDate() + durationDays);

      const updateData: Record<string, any> = {};

      if (promotion_type === "featured") {
        updateData.is_promoted = true;
        updateData.promoted_until = promotedUntil.toISOString();
      } else if (promotion_type === "urgent") {
        updateData.is_urgent = true;
      }

      const { error } = await supabaseAdmin
        .from("listings")
        .update(updateData)
        .eq("id", listing_id);

      if (error) {
        console.error("Failed to activate promotion via crypto:", error);
      } else {
        console.log(
          `[Coinbase] Activated ${promotion_type} for listing ${listing_id} (event: ${eventType})`,
        );
      }
    }
  }

  // charge:failed — payment failed or expired, nothing to do
  if (eventType === "charge:failed") {
    console.log(
      `[Coinbase] Charge failed for listing: ${event.event?.data?.metadata?.listing_id}`,
    );
  }

  return NextResponse.json({ received: true });
}
