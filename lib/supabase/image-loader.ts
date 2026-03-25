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
}: ImageLoaderParams): string {
  // Full URLs (Supabase, Unsplash, etc.) — return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // Relative Supabase storage path — prepend the project URL
  if (src.startsWith("/storage/v1/")) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    return `${SUPABASE_URL}${src}`;
  }

  // Everything else (local assets like /nextbazar-logo.svg) — return as-is
  return src;
}
