import {
  getListingBySlugCached,
  getRelatedListingsCached,
} from "@/lib/supabase/queries";
import ListingDetail from "@/app/[locale]/listing/[slug]/listing-detail";

export const revalidate = 60;

/**
 * Listing detail page rendered within the standalone dealer shop layout.
 * Reuses the same ListingDetail component but inherits the shop's branded shell.
 */
export default async function ShopListingPage({
  params,
}: {
  params: Promise<{ slug: string; listingSlug: string }>;
}) {
  const { listingSlug } = await params;

  const listing = await getListingBySlugCached(listingSlug);

  const related = listing
    ? await getRelatedListingsCached(listing.category_id, listing.id)
    : [];

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Listing not found
        </h2>
        <p className="text-gray-500">
          This listing may have been removed or is no longer available.
        </p>
      </div>
    );
  }

  return <ListingDetail listing={listing} related={related} />;
}
