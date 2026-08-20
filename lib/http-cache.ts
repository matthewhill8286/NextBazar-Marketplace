/** Document-level HTTP cache. Used instead of Next Cache Components. */
export const cacheHeaders = {
  listings: {
    "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
  },
  reference: {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  },
  private: {
    "Cache-Control": "private, no-store",
  },
} as const;

export function documentCacheHeaders(userId: string | null): HeadersInit {
  return userId ? cacheHeaders.private : cacheHeaders.listings;
}
