import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Fetch categories for matching
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name");

    if (catError) {
      console.error("Categories fetch error:", catError);
    }

    const categoryList = (categories || [])
      .map((c) => `${c.slug}: ${c.name}`)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a marketplace listing assistant. Analyze this product image and generate listing details.

Available categories: ${categoryList}

Respond in JSON format:
{
  "title": "<catchy, specific listing title, max 60 chars>",
  "description": "<detailed description, 2-3 sentences about the item, its condition, and key features>",
  "category_slug": "<one of: ${(categories || []).map((c) => c.slug).join(", ")}>",
  "condition": "<one of: new, like_new, good, fair, for_parts>",
  "suggested_price": <number in EUR, or null if can't determine>,
  "price_confidence": "high" | "medium" | "low",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "low" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response" },
        { status: 500 },
      );
    }
    const result = JSON.parse(content);

    // Map category slug to ID
    const matchedCategory = (categories || []).find(
      (c) => c.slug === result.category_slug,
    );

    return NextResponse.json({
      ...result,
      category_id: matchedCategory?.id || null,
      category_name: matchedCategory?.name || null,
    });
  } catch (err: unknown) {
    console.error("AI autofill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze image" },
      { status: 500 },
    );
  }
}
