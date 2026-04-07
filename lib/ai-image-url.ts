/**
 * Prepare an image URL for use with external vision models (OpenAI/Anthropic).
 *
 * In local development, uploaded images live on http://127.0.0.1:54321
 * (the local Supabase instance). OpenAI's servers cannot reach localhost,
 * so passing such a URL through results in a 400 "Error while downloading".
 *
 * For local URLs we fetch the bytes server-side and convert them to a
 * base64 data URL, which the model can decode without an outbound fetch.
 * Public URLs are returned unchanged.
 */
export async function prepareImageUrlForVision(
  imageUrl: string,
): Promise<string> {
  if (!imageUrl) return imageUrl;

  let isLocal = false;
  try {
    const u = new URL(imageUrl);
    isLocal =
      u.hostname === "127.0.0.1" ||
      u.hostname === "localhost" ||
      u.hostname === "0.0.0.0" ||
      u.hostname.endsWith(".local");
  } catch {
    return imageUrl;
  }

  if (!isLocal) return imageUrl;

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch local image (${res.status})`);
    }
    const contentType = res.headers.get("content-type") || "image/webp";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("prepareImageUrlForVision failed:", err);
    throw err;
  }
}
