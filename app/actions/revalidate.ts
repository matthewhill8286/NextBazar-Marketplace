"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to bust the listing cache.
 * Call after activating, pausing, or updating a listing so the
 * public detail page reflects the new state immediately.
 */
export async function revalidateListings() {
  revalidateTag("listings", "max");
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
  revalidateTag("shops", "max");
  revalidateTag("categories", "max");
  revalidateTag("subcategories", "max");
  revalidateTag("locations", "max");
  revalidateTag("reference", "max");
}
