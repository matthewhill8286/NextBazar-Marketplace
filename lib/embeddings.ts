import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const MODEL = "text-embedding-3-small"; // 1536 dims, ~$0.02 / 1M tokens

/**
 * Generates a 1536-dim embedding for a search query or listing text.
 * Returns null if the OpenAI call fails (caller should fall back to full-text).
 */
export async function embed(text: string): Promise<number[] | null> {
  try {
    const res = await getOpenAI().embeddings.create({
      model: MODEL,
      input: text.slice(0, 8000), // stay well within token limit
    });
    return res.data[0].embedding;
  } catch (err) {
    console.error("[embeddings] OpenAI error", err);
    return null;
  }
}

/**
 * Builds the text we embed for a listing.
 * Concatenating key fields gives the model enough context for semantic matching.
 */
export function listingToText(listing: {
  title: string;
  description?: string | null;
  category_name?: string | null;
  location_name?: string | null;
  condition?: string | null;
}): string {
  return [
    listing.title,
    listing.description,
    listing.category_name ? `Category: ${listing.category_name}` : null,
    listing.location_name ? `Location: ${listing.location_name}` : null,
    listing.condition ? `Condition: ${listing.condition}` : null,
  ]
    .filter(Boolean)
    .join(". ");
}
