import { createClient } from "@supabase/supabase-js";

/**
 * Webhook idempotency guard.
 *
 * Prevents duplicate processing when payment providers retry delivery.
 * Uses a `webhook_events` table with a unique constraint on (provider, event_id).
 *
 * ## Setup (run once via migration):
 * ```sql
 * CREATE TABLE IF NOT EXISTS webhook_events (
 *   id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   provider   text NOT NULL,
 *   event_id   text NOT NULL,
 *   created_at timestamptz NOT NULL DEFAULT now(),
 *   UNIQUE (provider, event_id)
 * );
 * CREATE INDEX idx_webhook_events_created ON webhook_events (created_at);
 * ```
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type WebhookProvider = "stripe" | "coinbase";

/**
 * Attempt to claim an event for processing.
 *
 * Returns `true` if this is the first time we've seen this event (proceed
 * with processing). Returns `false` if the event has already been handled
 * (skip processing, return 200 to acknowledge receipt).
 *
 * Uses INSERT with ON CONFLICT DO NOTHING — if the unique constraint
 * fires, the insert is a no-op and `data` comes back null.
 */
export async function claimWebhookEvent(
  provider: WebhookProvider,
  eventId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("webhook_events")
    .insert({ provider, event_id: eventId })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation — event already processed
    if (error.code === "23505") return false;

    // For any other error (table missing, permissions, etc.) log but
    // allow processing to continue. This is a fail-open guard: better
    // to risk a duplicate than to block all webhook processing.
    console.error("[webhook-idempotency] Insert failed:", error.message);
    return true;
  }

  return !!data;
}
