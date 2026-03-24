import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { title, categoryId, condition } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Fetch similar listings from the database
    let query = supabase
      .from("listings")
      .select("title, price, condition, view_count, favorite_count")
      .eq("status", "active")
      .not("price", "is", null);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data: similar } = await query
      .order("created_at", { ascending: false })
      .limit(30);

    const listings = similar || [];
    const prices = listings
      .map((l) => l.price)
      .filter((p): p is number => p !== null);
    const avgPrice =
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null;
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    const prompt = `You are a pricing advisor for NextBazar, a Cyprus classifieds marketplace.

A seller is listing this item:
- Title: "${title}"
- Condition: ${condition || "not specified"}

MARKET DATA from ${listings.length} similar listings in this category:
- Average price: ${avgPrice ? `€${avgPrice}` : "No data"}
- Price range: ${minPrice && maxPrice ? `€${minPrice} — €${maxPrice}` : "No data"}
- Sample listings: ${listings
      .slice(0, 5)
      .map((l) => `"${l.title}" at €${l.price}`)
      .join(", ")}

Give pricing guidance in JSON:
{
  "suggested_price": <number in EUR, your best guess>,
  "price_low": <number, competitive/quick-sale price>,
  "price_high": <number, premium/patient price>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<2-3 sentences explaining your pricing logic>",
  "tips": ["<pricing tip 1>", "<pricing tip 2>", "<pricing tip 3>"],
  "market_summary": "<1 sentence about the current market for this type of item>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 400,
    });

    const guidance = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json({
      ...guidance,
      market: {
        similar_count: listings.length,
        avg_price: avgPrice,
        min_price: minPrice,
        max_price: maxPrice,
      },
    });
  } catch (err: unknown) {
    console.error("AI pricing error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate pricing guidance" },
      { status: 500 },
    );
  }
}
