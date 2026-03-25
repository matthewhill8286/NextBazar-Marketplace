import { type NextRequest, NextResponse } from "next/server";
import { getPromotionPrices, type PromotionType } from "@/lib/stripe";

const COINBASE_API = "https://api.commerce.coinbase.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, promotionType, origin } = body;

    if (!listingId || !promotionType || !origin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
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

    if (!process.env.COINBASE_COMMERCE_API_KEY) {
      return NextResponse.json(
        { error: "Crypto payments are not configured" },
        { status: 503 },
      );
    }

    const res = await fetch(`${COINBASE_API}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: promo.name,
        description: promo.description,
        local_price: {
          amount: (promo.amount / 100).toFixed(2),
          currency: "EUR",
        },
        pricing_type: "fixed_price",
        metadata: {
          listing_id: listingId,
          promotion_type: promotionType,
          duration_days: promo.duration.toString(),
        },
        redirect_url: `${origin}/promote/success?listing_id=${listingId}&method=crypto`,
        cancel_url: `${origin}/promote/${listingId}`,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Coinbase Commerce error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Failed to create crypto charge" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      hosted_url: data.data.hosted_url,
      charge_id: data.data.id,
      expires_at: data.data.expires_at,
    });
  } catch (err: unknown) {
    console.error("Crypto checkout error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create crypto charge",
      },
      { status: 500 },
    );
  }
}
