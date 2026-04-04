import type { Metadata } from "next";
import { Suspense } from "react";
import JsonLd from "@/app/components/json-ld";
import { routing } from "@/i18n/routing";
import { BASE_URL, buildAlternates, productJsonLd, breadcrumbJsonLd } from "@/lib/seo";
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
    alternates: buildAlternates(`/listing/${slug}`),
  };
}

// ─── JSON-LD injector (async, renders alongside listing) ─────────────────────
async function ListingJsonLd({ slug }: { slug: string }) {
  const listing = await getListingBySlugCached(slug);
  if (!listing) return null;

  const profile =
    listing.profiles && !Array.isArray(listing.profiles)
      ? listing.profiles
      : null;
  const category =
    listing.categories && !Array.isArray(listing.categories)
      ? listing.categories
      : null;

  const url = `${BASE_URL}/en/listing/${slug}`;

  return (
    <>
      <JsonLd
        data={productJsonLd({
          name: listing.title,
          description: listing.description?.slice(0, 300) || listing.title,
          image: listing.primary_image_url || undefined,
          price: listing.price ?? undefined,
          currency: listing.currency || "EUR",
          url,
          seller: profile?.display_name || undefined,
          condition: listing.condition || undefined,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: BASE_URL },
          ...(category
            ? [{ name: category.name, url: `${BASE_URL}/en/search?category=${category.slug}` }]
            : []),
          { name: listing.title, url },
        ])}
      />
    </>
  );
}

// ─── Page component — synchronous shell, params deferred into Suspense ───────
export default function ListingPage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  return (
    <>
      <Suspense>
        {props.params.then(({ slug }) => (
          <ListingJsonLd slug={slug} />
        ))}
      </Suspense>
      <Suspense fallback={<ListingLoading />}>
        {props.params.then(({ locale, slug }) => (
          <ListingContent locale={locale} slug={slug} />
        ))}
      </Suspense>
    </>
  );
}
