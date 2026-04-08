"use server";

import { revalidateTag } from "next/cache";

/**
 * Legacy blunt hammer — busts every listing cache entry (feeds + all detail
 * pages). Prefer the more targeted helpers below.
 *
 * Still exported so older callers keep working; consider migrating them to
 * `revalidateListingDetail(slug)` + `revalidateListingFeed()` as appropriate.
 */
export async function revalidateListings() {
  revalidateTag("listings", "max");
}

/**
 * Bust only the public listing COLLECTIONS (featured / recent / trending /
 * related / category listings / counts / popular slugs). Call this when a
 * listing is created, deleted, or changes anything that affects card display
 * (title, price, primary image, status).
 */
export async function revalidateListingFeed() {
  revalidateTag("listings:feed", "max");
}

/**
 * Bust only a SINGLE listing's detail cache. Pass the slug — this leaves the
 * homepage / category feeds untouched, so they continue to serve from cache.
 */
export async function revalidateListingDetail(slug: string) {
  revalidateTag(`listing:${slug}`, "max");
}

/**
 * Targeted edit-flow helper: the seller edited a listing (slug known). Bust
 * its detail page and the feeds so the new title / price / image surface
 * everywhere without touching unrelated listings.
 */
export async function revalidateListingEdit(slug: string) {
  revalidateTag(`listing:${slug}`, "max");
  revalidateTag("listings:feed", "max");
}

/**
 * Server action to bust the dealer shop cache.
 * Call after saving branding, changing plan tier, or any dealer_shops update
 * so the public /shop/[slug] page reflects changes immediately.
 */
export async function revalidateShop() {
  revalidateTag("shops", "max");
}

/**
 * Bust all data caches — useful after seeding or bulk data changes.
 */
export async function revalidateAll() {
  revalidateTag("listings", "max");
  revalidateTag("listings:feed", "max");
  revalidateTag("shops", "max");
  revalidateTag("categories", "max");
  revalidateTag("subcategories", "max");
  revalidateTag("locations", "max");
  revalidateTag("reference", "max");
}
