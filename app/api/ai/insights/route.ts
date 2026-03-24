import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    // Fetch the listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*, categories(name)")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Fetch similar listings (same category, active, with price)
    const { data: similar } = await supabase
      .from("listings")
      .select("title, price, view_count, favorite_count, condition, created_at")
      .eq("category_id", listing.category_id)
      .eq("status", "active")
      .not("price", "is", null)
      .neq("id", listingId)
      .order("created_at", { ascending: false })
      .limit(20);

    const similarListings = similar || [];
    const prices = similarListings
      .map((l) => l.price)
      .filter((p): p is number => p !== null);

    const avgPrice =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null;
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    const avgViews =
      similarListings.length > 0
        ? Math.round(
            similarListings.reduce((a, b) => a + (b.view_count || 0), 0) /
              similarListings.length,
          )
        : 0;

    // Build context for GPT
    const prompt = `You are a marketplace pricing analyst for NextBazar, a classifieds marketplace in Cyprus. Analyze this listing and provide insights.

LISTING:
- Title: ${listing.title}
- Price: ${listing.price ? `€${listing.price}` : "No price set"}
- Category: ${listing.categories?.name || "Unknown"}
- Condition: ${listing.condition || "Not specified"}
- Description: ${listing.description || "No description"}
- Views: ${listing.view_count || 0}
- Saves: ${listing.favorite_count || 0}

MARKET DATA (${similarListings.length} similar listings in same category):
- Average price: ${avgPrice ? `€${avgPrice}` : "N/A"}
- Price range: ${minPrice && maxPrice ? `€${minPrice} — €${maxPrice}` : "N/A"}
- Average views per listing: ${avgViews}

Respond in JSON format with these exact fields:
{
  "price_verdict": "underpriced" | "fair" | "overpriced" | "no_data",
  "price_low": <number, estimated fair low price in EUR>,
  "price_high": <number, estimated fair high price in EUR>,
  "price_explanation": "<1 sentence explaining the price analysis>",
  "quality_score": <number 0-100>,
  "quality_tips": ["<tip 1>", "<tip 2>"],
  "demand_level": "high" | "medium" | "low",
  "demand_explanation": "<1 sentence about demand>",
  "sell_time_estimate": "<e.g. '3-5 days' or '1-2 weeks'>",
  "top_tip": "<single best tip to improve this listing>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    });

    const insights = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json({
      insights,
      market: {
        similar_count: similarListings.length,
        avg_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
        avg_views: avgViews,
      },
    });
  } catch (err: unknown) {
    console.error("AI insights error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate insights" },
      { status: 500 },
    );
  }
}
