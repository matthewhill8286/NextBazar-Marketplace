import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { title, category, condition, price, imageUrl } =
      await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert marketplace copywriter for NextBazar, a classifieds platform in Cyprus.
Write compelling, honest listing descriptions that sell.
- Be specific and highlight key features
- Mention condition honestly
- Include practical details (dimensions, compatibility, included accessories)
- End with a call to action
- Keep it 3-5 sentences, natural tone, no fluff or over-the-top sales language
- Write in English
- Do NOT use markdown formatting, just plain text`,
      },
    ];

    // If we have an image, use vision
    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Write a listing description for this item:
Title: ${title}
${category ? `Category: ${category}` : ""}
${condition ? `Condition: ${condition}` : ""}
${price ? `Asking price: €${price}` : ""}

Look at the photo for additional details to include.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "low" },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Write a listing description for this item:
Title: ${title}
${category ? `Category: ${category}` : ""}
${condition ? `Condition: ${condition}` : ""}
${price ? `Asking price: €${price}` : ""}`,
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const description = response.choices[0].message.content?.trim() || "";

    return NextResponse.json({ description });
  } catch (err: unknown) {
    console.error("AI describe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate description" },
      { status: 500 },
    );
  }
}
