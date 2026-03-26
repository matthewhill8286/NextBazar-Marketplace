import {
  getListingBySlugCached,
  getRelatedListingsCached,
  getShopAccentColorCached,
} from "@/lib/supabase/queries";
import ListingDetail from "./listing-detail";

// Revalidate ISR every 60 seconds — matches the cache TTL in queries.ts
export const revalidate = 60;

export default async function ListingPage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  const { slug } = await props.params;

  const listing = await getListingBySlugCached(slug);

  // Fetch related listings + shop accent color in parallel
  const [related, accentColor] = await Promise.all([
    listing
      ? getRelatedListingsCached(listing.category_id, listing.id)
      : Promise.resolve([]),
    listing?.profiles && !Array.isArray(listing.profiles) && listing.profiles.is_pro_seller
      ? getShopAccentColorCached(listing.user_id)
      : Promise.resolve(null),
  ]);

  return (
    <ListingDetail
      slug={slug}
      initialListing={listing}
      initialRelated={related}
      initialAccentColor={accentColor}
    />
  );
}
