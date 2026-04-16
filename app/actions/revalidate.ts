"use server";

import { revalidateTag } from "next/cache";
import { tag } from "@/lib/supabase/queries";

// ─── Surgical revalidation ──────────────────────────────────────────────────
// Prefer the narrowest bust that covers the mutation.
//
//   revalidateListingDetail(slug) — single listing detail page
//   revalidateListingFeeds()      — aggregate feeds (home, trending, category)
//   revalidateListings()          — detail + feeds (convenience for edit-client)
//   revalidateShop()              — all shop data
//   revalidateAll()               — nuclear option for bulk/seed operations

/**
 * Bust a single listing's detail cache.
 * Call after editing title, images, price, etc.
 */
export async function revalidateListingDetail(slug: string) {
  revalidateTag(tag.listing(slug), "max");
}

/**
 * Bust the aggregate listing feed caches (featured, recent, trending,
 * category listings, search trending, listing count, popular slugs).
 * Call after status changes that affect which listings appear in feeds.
 */
export async function revalidateListingFeeds() {
  revalidateTag(tag.listingsFeed, "max");
}

/**
 * Convenience: bust both the detail page for a specific listing AND all
 * aggregate feeds. Used after a listing edit where both the detail and feed
 * cards need to reflect the new data.
 */
export async function revalidateListings(slug?: string) {
  revalidateTag(tag.listingsFeed, "max");
  if (slug) {
    revalidateTag(tag.listing(slug), "max");
  }
}

/**
 * Bust the dealer shop cache.
 * Call after saving branding, changing plan tier, or any dealer_shops update.
 */
export async function revalidateShop() {
  revalidateTag(tag.shops, "max");
}

/**
 * Nuclear: bust every data cache. Use after seeding or bulk data changes.
 */
export async function revalidateAll() {
  revalidateTag(tag.listingsAll, "max");
  revalidateTag(tag.shops, "max");
  revalidateTag(tag.categories, "max");
  revalidateTag(tag.subcategories, "max");
  revalidateTag(tag.locations, "max");
  revalidateTag(tag.pricing, "max");
}
