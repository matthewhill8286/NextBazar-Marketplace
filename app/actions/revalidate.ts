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
