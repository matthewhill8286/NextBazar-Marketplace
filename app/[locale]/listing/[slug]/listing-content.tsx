import { useTranslations } from "next-intl";
import { NotFoundIllustration } from "@/app/components/illustrations";
import { Link } from "@/i18n/navigation";
import type { SellerShopInfo } from "@/lib/supabase/queries";
import type {
  ListingCardRow,
  ListingDetailRow,
} from "@/lib/supabase/supabase.types";
import ListingDetailServer from "./listing-detail-server";
import RelatedListings from "./related-listings";

export default function ListingContent({
  locale,
  listing,
  related,
  shopInfo,
}: {
  locale: string;
  listing: ListingDetailRow | null;
  related: ListingCardRow[];
  shopInfo: SellerShopInfo | null;
}) {
  const t = useTranslations("listing");

  if (!listing) {
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

  const categorySlug =
    listing.categories && !Array.isArray(listing.categories)
      ? listing.categories.slug
      : "";

  return (
    <>
      <ListingDetailServer
        locale={locale}
        listing={listing}
        related={related}
        accentColor={shopInfo?.accent_color ?? null}
        shopSlug={shopInfo?.slug ?? null}
        shopInfo={shopInfo}
      />
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <RelatedListings related={related} categorySlug={categorySlug} />
      </div>
    </>
  );
}
