import type { Metadata } from "next";
import { Suspense } from "react";
import { buildAlternates } from "@/lib/seo";
import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import SearchClient from "./search-client";
import SearchLoading from "./loading";

export const metadata: Metadata = {
  title: "Search Listings — NextBazar",
  description: "Search and browse thousands of listings on NextBazar.",
  alternates: buildAlternates("/search"),
};

/**
 * Async server component that fetches reference data then renders SearchClient.
 * Wrapped in Suspense so the shell ships immediately.
 */
async function SearchContent() {
  const [categories, subcategories, locations] = await Promise.all([
    getCategoriesCached(),
    getSubcategoriesCached(),
    getLocationsCached(),
  ]);

  return (
    <SearchClient
      initialCategories={categories}
      initialSubcategories={subcategories}
      initialLocations={locations}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
