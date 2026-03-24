import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

// Service-role client — bypasses RLS so we can update any offer
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * GET /api/cron/expire-offers
 *
 * Called by Vercel Cron (see vercel.json) every hour.
 * Finds all pending/countered offers whose expires_at has passed,
 * marks them as "expired", and inserts notifications for both
 * buyer and seller.
 *
 * Protect with CRON_SECRET so only Vercel can invoke it.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  // 1. Find all offers that should expire
  const { data: expiredOffers, error: fetchError } = await supabaseAdmin
    .from("offers")
    .select("id, buyer_id, seller_id, listing_id, amount, currency, listings(title, slug)")
    .in("status", ["pending", "countered"])
    .lt("expires_at", now);

  if (fetchError) {
    console.error("Failed to fetch expired offers:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!expiredOffers || expiredOffers.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  const ids = expiredOffers.map((o) => o.id);

  // 2. Bulk-update their status to "expired"
  const { error: updateError } = await supabaseAdmin
    .from("offers")
    .update({ status: "expired", responded_at: now })
    .in("id", ids);

  if (updateError) {
    console.error("Failed to expire offers:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 3. Insert notifications for buyer and seller on each offer
  const notifications: {
    user_id: string;
    type: string;
    title: string;
    body: string;
    offer_id: string;
    listing_id: string;
    link: string;
  }[] = [];

  for (const offer of expiredOffers) {
    const listing = Array.isArray(offer.listings)
      ? offer.listings[0]
      : offer.listings;
    const title = listing?.title ?? "your listing";
    const sym = offer.currency === "EUR" ? "€" : offer.currency;
    const amount = `${sym}${Number(offer.amount).toLocaleString()}`;
    const link = `/dashboard/offers`;

    // Notify buyer
    notifications.push({
      user_id: offer.buyer_id,
      type: "offer_expired",
      title: "Offer expired",
      body: `Your ${amount} offer on "${title}" was not responded to in time.`,
      offer_id: offer.id,
      listing_id: offer.listing_id,
      link,
    });

    // Notify seller
    notifications.push({
      user_id: offer.seller_id,
      type: "offer_expired",
      title: "Offer expired",
      body: `A ${amount} offer on "${title}" expired without a response.`,
      offer_id: offer.id,
      listing_id: offer.listing_id,
      link,
    });
  }

  const { error: notifError } = await supabaseAdmin
    .from("notifications")
    .insert(notifications);

  if (notifError) {
    // Non-fatal — offers are already expired; log and continue
    console.error("Failed to insert expiry notifications:", notifError);
  }

  console.log(`Expired ${ids.length} offers, inserted ${notifications.length} notifications`);
  return NextResponse.json({ expired: ids.length });
}
