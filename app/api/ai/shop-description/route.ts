import { type NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { shopName, currentDescription } = await request.json();

    if (!shopName) {
      return NextResponse.json(
        { error: "Shop name is required" },
        { status: 400 },
      );
    }

    const prompt = currentDescription
      ? `Improve this shop description for "${shopName}" on NextBazar (a classifieds marketplace in Cyprus). Make it more engaging and professional while keeping the original intent:\n\n"${currentDescription}"\n\nReturn only the improved description, no quotes or extra formatting.`
      : `Write a short, engaging shop description for "${shopName}" on NextBazar, a classifieds marketplace in Cyprus. The description should:\n- Be 2-3 sentences\n- Sound professional yet friendly\n- Mention what buyers can expect\n- End with something inviting\n- Be in English, plain text, no markdown\n\nReturn only the description, no quotes or extra formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert copywriter helping sellers write compelling shop descriptions for an online classifieds marketplace. Keep descriptions concise, professional, and buyer-friendly. Never use markdown formatting.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const description = response.choices[0].message.content?.trim() || "";

    return NextResponse.json({ description });
  } catch (err: unknown) {
    console.error("AI shop-description error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate description",
      },
      { status: 500 },
    );
  }
}
