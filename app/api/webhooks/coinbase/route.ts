import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { claimWebhookEvent } from "@/lib/webhook-idempotency";

// Service role client — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("x-cc-webhook-signature");

  // Verify Coinbase Commerce webhook signature. Fail CLOSED: if the secret
  // is not configured the endpoint refuses all traffic rather than silently
  // accepting unsigned payloads.
  const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(
      "COINBASE_COMMERCE_WEBHOOK_SECRET is not set — rejecting payload.",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const hmac = createHmac("sha256", webhookSecret).update(body).digest("hex");
  // Constant-time comparison to avoid timing side-channels.
  if (hmac.length !== sig.length) {
    console.error("Coinbase webhook signature length mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  let mismatch = 0;
  for (let i = 0; i < hmac.length; i++) {
    mismatch |= hmac.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (mismatch !== 0) {
    console.error("Coinbase webhook signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── Idempotency: skip already-processed events ────────────────────────
  const coinbaseEventId = event.event?.id || event.id;
  if (coinbaseEventId) {
    const isNew = await claimWebhookEvent("coinbase", String(coinbaseEventId));
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true });
    }
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
      }
    }
  }

  // charge:failed — payment failed or expired, nothing to do
  if (eventType === "charge:failed") {
    console.error(
      "[Coinbase] Charge failed for listing:",
      event.event?.data?.metadata?.listing_id,
    );
  }

  return NextResponse.json({ received: true });
}
