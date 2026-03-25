/**
 * Custom Next.js image loader for Supabase Storage.
 *
 * When using `loader: "custom"` in next.config.js, Next.js delegates all
 * `<Image>` src resolution to this function instead of its built-in
 * optimization proxy (which requires `remotePatterns`).
 *
 * - Supabase Storage URLs are served directly from the public bucket.
 * - Local assets (from public/) are returned as-is so they keep working.
 * - External URLs (unsplash, picsum, etc.) are passed through unchanged.
 *
 * @see https://supabase.com/docs/guides/storage/image-transformations
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/images#supabase
 */

type ImageLoaderParams = {
  src: string;
  width: number;
  quality?: number;
};

export default function supabaseImageLoader({
  src,
  width,
  quality,
}: ImageLoaderParams): string {
  const q = quality || 75;

  // Full Supabase storage URLs — append width/quality query params
  if (
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}w=${width}&q=${q}`;
  }

  // Relative Supabase storage path — prepend the project URL + params
  if (src.startsWith("/storage/v1/")) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    return `${SUPABASE_URL}${src}?w=${width}&q=${q}`;
  }

  // Everything else (local assets like /nextbazar-logo.svg) — pass width through
  return `${src}?w=${width}&q=${q}`;
}
