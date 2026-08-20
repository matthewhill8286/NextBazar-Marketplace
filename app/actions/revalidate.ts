"use server";

/**
 * Cache-bust helpers are no-ops after leaving Next Cache Components.
 * Loaders always fetch fresh (or short HTTP cache). Kept so existing
 * client call sites compile without Next.
 */
export async function revalidateListingDetail(_slug: string) {}
export async function revalidateListingFeeds() {}
export async function revalidateListings(_slug?: string) {}
export async function revalidateShop() {}
export async function revalidateAll() {}
