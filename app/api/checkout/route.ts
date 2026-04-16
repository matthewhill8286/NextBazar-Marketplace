import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { limit, tooManyRequests } from "@/lib/rate-limit";
import { getPromotionPrices, type PromotionType, stripe } from "@/lib/stripe";

// Service-role client used only to verify listing ownership. We never write
// to the DB from this route — activation happens in the Stripe webhook.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    // Must be signed in to promote a listing. Prevents anonymous callers
    // from burning Stripe API quota or stuffing garbage listing IDs into
    // Stripe metadata that later flows to our webhook.
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { userId } = auth;

    // Per-user rate limit: 10 promotion-checkout attempts per minute is
    // plenty for legitimate use and blunts enumeration attacks.
    const rl = await limit(`checkout:${userId}`, {
      max: 10,
      windowMs: 60_000,
    });
    if (!rl.success) return tooManyRequests(rl);

    const body = await request.json();
    const { listingId, promotionType, origin, embedded = false } = body;

    if (!listingId || !promotionType || !origin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify the listing exists AND the caller owns it. This is the
    // authorisation check — promotions are a seller-only feature.
    const { data: listing, error: listingError } = await supabaseAdmin
      .from("listings")
      .select("id, user_id")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError) {
      console.error("Listing lookup failed:", listingError);
      return NextResponse.json(
        { error: "Listing lookup failed" },
        { status: 500 },
      );
    }
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.user_id !== userId) {
      return NextResponse.json(
        { error: "You can only promote your own listings" },
        { status: 403 },
      );
    }

    const prices = await getPromotionPrices();
    const promo = prices[promotionType as PromotionType];
    if (!promo) {
      return NextResponse.json(
        { error: "Invalid promotion type" },
        { status: 400 },
      );
    }

    // Resolve price ID — if set in DB, use it; otherwise create on the fly
    // (matches whatever mode the STRIPE_SECRET_KEY is in: test or live)
    let priceId = promo.priceId;
    if (!priceId) {
      const product = await stripe.products.create({
        name: promo.name,
        description: promo.description,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: promo.amount,
        currency: "eur",
      });
      priceId = price.id;
    }

    const sharedParams = {
      mode: "payment" as const,
      line_items: [{ price: priceId, quantity: 1 }],
      // Record the initiating user so webhook/activate handlers can audit
      // and cross-check against listing ownership.
      metadata: {
        listing_id: listingId,
        promotion_type: promotionType,
        duration_days: promo.duration.toString(),
        initiated_by: userId,
      },
    };

    if (embedded) {
      // Embedded checkout — return clientSecret, Stripe renders the form in-page
      const session = await stripe.checkout.sessions.create({
        ...sharedParams,
        ui_mode: "embedded",
        return_url: `${origin}/promote/success?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}`,
      });
      return NextResponse.json({ clientSecret: session.client_secret });
    } else {
      // Hosted checkout — redirect to Stripe's page
      const session = await stripe.checkout.sessions.create({
        ...sharedParams,
        success_url: `${origin}/promote/success?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}`,
        cancel_url: `${origin}/promote/${listingId}`,
      });
      return NextResponse.json({ url: session.url });
    }
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create checkout session",
      },
      { status: 500 },
    );
  }
}
