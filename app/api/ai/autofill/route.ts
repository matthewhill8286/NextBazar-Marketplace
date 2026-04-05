import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "AI features are not configured. Please add your OpenAI API key.",
        },
        { status: 503 },
      );
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Fetch categories and subcategories for matching
    const [{ data: categories, error: catError }, { data: subcategories }] =
      await Promise.all([
        supabase.from("categories").select("id, name, slug").order("name"),
        supabase
          .from("subcategories")
          .select("id, name, slug, category_id")
          .order("sort_order"),
      ]);

    if (catError) {
      console.error("Categories fetch error:", catError);
    }

    const categoryList = (categories || [])
      .map((c) => {
        const subs = (subcategories || [])
          .filter((s) => s.category_id === c.id)
          .map((s) => s.slug)
          .join(", ");
        return `${c.slug}: ${c.name}${subs ? ` (subcategories: ${subs})` : ""}`;
      })
      .join("; ");

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
  "subcategory_slug": "<best matching subcategory slug from the category's subcategories list, or null>",
  "condition": "<one of: new, like_new, good, fair, for_parts>",
  "suggested_price": <number in EUR, or null if can't determine>,
  "price_confidence": "high" | "medium" | "low",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}

IMPORTANT: If the image is a vehicle (car, motorcycle, van, truck, etc.) and category_slug is "vehicles", also include a "vehicle_attributes" object with any details you can determine from the image:
{
  "vehicle_attributes": {
    "make": "<manufacturer, e.g. Toyota, BMW>",
    "model": "<model name>",
    "year": "<4-digit year if visible/estimable>",
    "color": "<exterior color>",
    "body_type": "<sedan|suv|hatchback|coupe|convertible|wagon|van|truck|pickup>",
    "doors": "<number of doors if visible>",
    "fuel_type": "<petrol|diesel|electric|hybrid|lpg if determinable>",
    "transmission": "<automatic|manual if determinable>",
    "engine_size": "<in litres if determinable>",
    "drive_type": "<fwd|rwd|awd|4wd if determinable>"
  }
}
Only include vehicle_attributes fields you can confidently determine from the image. Omit fields you cannot infer.`,
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

    // Map subcategory slug to ID (must belong to the matched category)
    const matchedSubcategory = matchedCategory
      ? (subcategories || []).find(
          (s) =>
            s.slug === result.subcategory_slug &&
            s.category_id === matchedCategory.id,
        )
      : null;

    return NextResponse.json({
      ...result,
      category_id: matchedCategory?.id || null,
      category_name: matchedCategory?.name || null,
      subcategory_id: matchedSubcategory?.id || null,
      subcategory_name: matchedSubcategory?.name || null,
    });
  } catch (err: unknown) {
    console.error("AI autofill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze image" },
      { status: 500 },
    );
  }
}
