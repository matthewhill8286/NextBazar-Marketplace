import type { Metadata } from "next";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import {
  getListingBySlugCached,
  getPopularListingSlugs,
} from "@/lib/supabase/queries";
import ListingContent from "./listing-content";
import ListingLoading from "./loading";

// ─── Pre-render top listings at build time for instant loads ─────────────────
export async function generateStaticParams() {
  const slugs = await getPopularListingSlugs(50);
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

// ─── SEO metadata ────────────────────────────────────────────────────────────
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

// ─── Page component — synchronous shell, params deferred into Suspense ───────
export default function ListingPage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  return (
    <Suspense fallback={<ListingLoading />}>
      {props.params.then(({ locale, slug }) => (
        <ListingContent locale={locale} slug={slug} />
      ))}
    </Suspense>
  );
}
