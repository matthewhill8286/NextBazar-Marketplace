import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Fetch categories and locations for context
    const [{ data: categories }, { data: locations }] = await Promise.all([
      supabase.from("categories").select("id, name, slug").order("sort_order"),
      supabase.from("locations").select("id, name, slug").order("sort_order"),
    ]);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a search query parser for NextBazar, a classifieds marketplace in Cyprus.

Parse this natural language search query into structured filters.

Available categories: ${(categories || []).map((c) => `${c.slug}:${c.name}`).join(", ")}
Available locations: ${(locations || []).map((l) => `${l.slug}:${l.name}`).join(", ")}

User query: "${query}"

Respond in JSON:
{
  "search_text": "<keywords to search for, or empty string if none>",
  "category_slug": "<matched category slug or null>",
  "location_slug": "<matched location slug or null>",
  "min_price": <number or null>,
  "max_price": <number or null>,
  "condition": "<new|like_new|good|fair|for_parts or null>",
  "sort": "newest" | "price_low" | "price_high" | "popular",
  "interpretation": "<1 sentence explaining how you interpreted the query>"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 300,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");

    // Map slugs to IDs
    const category = (categories || []).find(
      (c) => c.slug === parsed.category_slug,
    );
    const location = (locations || []).find(
      (l) => l.slug === parsed.location_slug,
    );

    // Build the Supabase query
    let q = supabase
      .from("listings")
      .select("*, categories(name, slug, icon), locations(name, slug)")
      .eq("status", "active");

    if (parsed.search_text) {
      q = q.textSearch("search_vector", parsed.search_text, {
        type: "websearch",
        config: "english",
      });
    }

    if (category) {
      q = q.eq("category_id", category.id);
    }

    if (location) {
      q = q.eq("location_id", location.id);
    }

    if (parsed.min_price !== null && parsed.min_price !== undefined) {
      q = q.gte("price", parsed.min_price);
    }

    if (parsed.max_price !== null && parsed.max_price !== undefined) {
      q = q.lte("price", parsed.max_price);
    }

    if (parsed.condition) {
      q = q.eq("condition", parsed.condition);
    }

    // Promoted listings always surface first, then apply AI-chosen sort
    q = q.order("is_promoted", { ascending: false });
    if (parsed.sort === "price_low") q = q.order("price", { ascending: true });
    else if (parsed.sort === "price_high")
      q = q.order("price", { ascending: false });
    else if (parsed.sort === "popular")
      q = q.order("view_count", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const { data: listings } = await q.limit(24);

    return NextResponse.json({
      listings: listings || [],
      filters: {
        search_text: parsed.search_text || "",
        category_slug: parsed.category_slug,
        location_slug: parsed.location_slug,
        min_price: parsed.min_price,
        max_price: parsed.max_price,
        condition: parsed.condition,
        sort: parsed.sort,
      },
      interpretation: parsed.interpretation,
    });
  } catch (err: unknown) {
    console.error("AI search error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to process search",
      },
      { status: 500 },
    );
  }
}
