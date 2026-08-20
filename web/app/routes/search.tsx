import SearchClient from "@/app/[locale]/search/search-client";
import { GET as searchGet } from "@/app/api/search/route";
import {
  getCategoriesCached,
  getFeaturedListingsCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import type { SearchListing } from "@/lib/supabase/supabase.types";
import type { Route } from "./+types/search";

export function meta() {
  return [
    { title: "Search Listings — NextBazar" },
    { name: "description", content: "Search and browse thousands of listings on NextBazar." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const [categories, subcategories, locations, searchRes, featured] =
    await Promise.all([
      getCategoriesCached(),
      getSubcategoriesCached(),
      getLocationsCached(),
      searchGet(request as never),
      getFeaturedListingsCached(),
    ]);
  const json = searchRes.ok ? await searchRes.json() : { hits: [], totalHits: 0, facets: undefined };
  return {
    categories,
    subcategories,
    locations,
    hits: (json.hits || []) as SearchListing[],
    totalHits: json.totalHits ?? 0,
    facets: json.facets,
    featured,
    hasQuery: Boolean(
      url.searchParams.get("q") ||
        url.searchParams.get("category") ||
        url.searchParams.get("location"),
    ),
  };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  return (
    <SearchClient
      initialCategories={loaderData.categories}
      initialSubcategories={loaderData.subcategories}
      initialLocations={loaderData.locations}
      initialListings={loaderData.hits}
      initialTotalHits={loaderData.totalHits}
      initialFacets={loaderData.facets}
      initialFeatured={loaderData.hasQuery ? undefined : (loaderData.featured as SearchListing[])}
    />
  );
}
