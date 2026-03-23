import {
  getListingBySlugCached,
  getRelatedListingsCached,
} from "@/lib/supabase/queries";
import ListingDetail from "./listing-detail";

// Revalidate ISR every 60 seconds — matches the cache TTL in queries.ts
export const revalidate = 60;

export default async function ListingPage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  const { slug } = await props.params;

  const listing = await getListingBySlugCached(slug);

  // Fetch related listings in parallel only when listing is found
  const related = listing
    ? await getRelatedListingsCached(listing.category_id, listing.id)
    : [];

  return (
    <ListingDetail slug={slug} initialListing={listing} initialRelated={related} />
  );
}
