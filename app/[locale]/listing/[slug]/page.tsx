import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NotFoundIllustration } from "@/app/components/illustrations";
import {
  getListingBySlugCached,
  getListingPageDataCached,
} from "@/lib/supabase/queries";
import ListingDetailServer from "./listing-detail-server";

// ─── SEO metadata (reuses the same cache as the page component) ──────────────
export async function generateMetadata(
  props: PageProps<"/[locale]/listing/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const listing = await getListingBySlugCached(slug);

  if (!listing) {
    return {
      title: "Listing Not Found — NextBazar",
      description: "This listing could not be found on NextBazar.",
    };
  }

  const profile =
    listing.profiles && !Array.isArray(listing.profiles)
      ? listing.profiles
      : null;
  const category =
    listing.categories && !Array.isArray(listing.categories)
      ? listing.categories
      : null;
  const price =
    listing.price !== null
      ? `${listing.currency === "EUR" ? "€" : listing.currency}${listing.price.toLocaleString()}`
      : "Contact for price";

  const title = `${listing.title} — ${price} | NextBazar`;
  const description = listing.description
    ? listing.description.slice(0, 160)
    : `${listing.title} for ${price} in ${category?.name || "marketplace"}. ${profile?.display_name ? `Sold by ${profile.display_name}.` : ""} Browse on NextBazar.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.primary_image_url
        ? [{ url: listing.primary_image_url, width: 800, height: 600 }]
        : [],
      type: "website",
    },
    twitter: {
      card: listing.primary_image_url ? "summary_large_image" : "summary",
      title,
      description,
      images: listing.primary_image_url ? [listing.primary_image_url] : [],
    },
  };
}

export default async function ListingPage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  const { slug } = await props.params;

  // Single cached call: listing + related + accent color + shop slug
  // Internally runs listing first, then related & accent in parallel
  const { listing, related, accentColor, shopSlug } =
    await getListingPageDataCached(slug);

  // Not-found state
  if (!listing) {
    const t = await getTranslations("listing");
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <NotFoundIllustration className="w-32 h-28 mb-6 text-[#ccc]" />
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          {t("notFound")}
        </h1>
        <p className="text-[#999] mb-6">{t("notFoundDesc")}</p>
        <Link
          href="/"
          className="bg-[#2C2826] text-white px-6 py-3 font-semibold hover:bg-[#3D3633] transition-colors"
        >
          {t("browseListings")}
        </Link>
      </div>
    );
  }

  return (
    <ListingDetailServer
      listing={listing}
      related={related}
      accentColor={accentColor}
      shopSlug={shopSlug}
    />
  );
}
