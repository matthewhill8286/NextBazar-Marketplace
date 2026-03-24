import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    if (!title && !description) {
      return NextResponse.json(
        { error: "Title or description is required" },
        { status: 400 },
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an automotive expert. Extract vehicle attributes from the listing title and description.
Return a JSON object with ONLY the fields you can confidently determine. Omit fields you cannot infer.

Possible fields:
- make: string (manufacturer, e.g. "Toyota", "BMW", "Mercedes-Benz")
- model: string (e.g. "Corolla", "3 Series", "C-Class")
- year: string (4-digit year, e.g. "2020")
- mileage: string (numeric km, e.g. "45000")
- fuel_type: string (one of: "petrol", "diesel", "electric", "hybrid", "lpg")
- transmission: string (one of: "automatic", "manual")
- color: string (e.g. "Black", "White", "Silver")
- body_type: string (one of: "sedan", "suv", "hatchback", "coupe", "convertible", "wagon", "van", "truck", "pickup")
- engine_size: string (in litres, e.g. "1.6", "2.0")
- doors: string (e.g. "4", "2", "5")
- drive_type: string (one of: "fwd", "rwd", "awd", "4wd")
- owners: string (number of previous owners, e.g. "1", "2")
- service_history: string (one of: "full", "partial", "none")

Return ONLY valid JSON, no markdown fences or explanation.`,
        },
        {
          role: "user",
          content: `Title: ${title || ""}
Description: ${description || ""}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content?.trim() || "{}";

    // Parse AI response, stripping any markdown fences
    let attributes: Record<string, string> = {};
    try {
      const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      attributes = JSON.parse(cleaned);
    } catch {
      // If parsing fails, return empty — user can fill manually
      attributes = {};
    }

    return NextResponse.json({ attributes });
  } catch (err: unknown) {
    console.error("AI vehicle-enrich error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to extract vehicle details",
      },
      { status: 500 },
    );
  }
}
