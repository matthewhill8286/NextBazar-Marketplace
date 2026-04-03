import { Suspense } from "react";
import { NotFoundIllustration } from "@/app/components/illustrations";
import { Link } from "@/i18n/navigation";
import {
  getListingBySlugCached,
  getShopAccentColorCached,
} from "@/lib/supabase/queries";
import { getTranslator } from "@/lib/translations";
import ListingDetailServer from "./listing-detail-server";
import RelatedListings from "./related-listings";

/** Async server component that resolves the listing slug, fetches data, and renders. */
export default async function ListingContent({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  const listing = await getListingBySlugCached(slug);

  if (!listing) {
    const t = await getTranslator(locale, "listing");
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <NotFoundIllustration className="w-32 h-28 mb-6 text-[#8a8280]" />
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          {t("notFound")}
        </h1>
        <p className="text-[#6b6560] mb-6">{t("notFoundDesc")}</p>
        <Link
          href="/"
          className="bg-[#2C2826] text-white px-6 py-3 font-semibold hover:bg-[#3D3633] transition-colors"
        >
          {t("browseListings")}
        </Link>
      </div>
    );
  }

  const profile =
    listing.profiles && !Array.isArray(listing.profiles)
      ? listing.profiles
      : null;
  const isPro = profile?.is_pro_seller;
  const accentColor = isPro
    ? await getShopAccentColorCached(listing.user_id)
    : null;

  const categorySlug =
    listing.categories && !Array.isArray(listing.categories)
      ? listing.categories.slug
      : "";

  return (
    <>
      <ListingDetailServer
        locale={locale}
        listing={listing}
        related={[]}
        accentColor={accentColor}
        shopSlug={null}
      />

      {/* Related listings — stream in separately, below the fold */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <Suspense
          fallback={
            <section className="mt-20">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <div className="animate-pulse bg-[#e8e6e3] h-3 w-28 mb-4" />
                  <div className="animate-pulse bg-[#e8e6e3] h-9 w-48" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-[#e8e6e3] bg-white">
                    <div className="animate-pulse bg-[#e8e6e3] aspect-[4/3] w-full" />
                    <div className="p-4 space-y-3">
                      <div className="animate-pulse bg-[#e8e6e3] h-4 w-3/4" />
                      <div className="animate-pulse bg-[#e8e6e3] h-3 w-1/2" />
                      <div className="animate-pulse bg-[#e8e6e3] h-6 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          }
        >
          <RelatedListings
            locale={locale}
            categoryId={listing.category_id}
            excludeId={listing.id}
            categorySlug={categorySlug}
          />
        </Suspense>
      </div>
    </>
  );
}
