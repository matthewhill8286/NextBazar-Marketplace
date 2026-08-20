import { data } from "react-router";
import JsonLd from "@/app/components/json-ld";
import ListingContent from "@/app/[locale]/listing/[slug]/listing-content";
import { getUserId } from "@/lib/auth/require-auth";
import { documentCacheHeaders } from "@/lib/http-cache";
import {
  BASE_URL,
  breadcrumbJsonLd,
  productJsonLd,
} from "@/lib/seo";
import {
  getListingPageDataCached,
  getRelatedListingsCached,
  getSellerShopInfoCached,
} from "@/lib/supabase/queries";
import type { Route } from "./+types/listing";

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug!;
  const page = await getListingPageDataCached(slug);
  const listing = page.listing;
  const related = listing
    ? await getRelatedListingsCached(listing.category_id, listing.id)
    : [];
  const profile =
    listing?.profiles && !Array.isArray(listing.profiles)
      ? listing.profiles
      : null;
  const shopInfo =
    profile?.is_pro_seller && listing
      ? await getSellerShopInfoCached(listing.user_id)
      : null;
  const userId = await getUserId();
  return data(
    { locale: params.locale, slug, listing, related, shopInfo },
    { headers: documentCacheHeaders(userId) },
  );
}

export function meta({ data }: Route.MetaArgs) {
  const listing = data?.listing;
  if (!listing) return [{ title: "Listing Not Found — NextBazar" }];
  const price =
    listing.price !== null
      ? `${listing.currency === "EUR" ? "€" : listing.currency}${listing.price.toLocaleString()}`
      : "Contact for price";
  const title = `${listing.title} — ${price} | NextBazar`;
  const description = listing.description
    ? listing.description.slice(0, 160)
    : listing.title;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    ...(listing.primary_image_url
      ? [{ property: "og:image", content: listing.primary_image_url }]
      : []),
  ];
}

export default function ListingPage({ loaderData }: Route.ComponentProps) {
  const { locale, listing, related, shopInfo, slug } = loaderData;
  const profile =
    listing?.profiles && !Array.isArray(listing.profiles)
      ? listing.profiles
      : null;
  const category =
    listing?.categories && !Array.isArray(listing.categories)
      ? listing.categories
      : null;
  const url = `${BASE_URL}/${locale}/listing/${slug}`;
  return (
    <>
      {listing && (
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
                ? [
                    {
                      name: category.name,
                      url: `${BASE_URL}/${locale}/search?category=${category.slug}`,
                    },
                  ]
                : []),
              { name: listing.title, url },
            ])}
          />
        </>
      )}
      <ListingContent
        locale={locale!}
        listing={listing}
        related={related}
        shopInfo={shopInfo}
      />
    </>
  );
}
