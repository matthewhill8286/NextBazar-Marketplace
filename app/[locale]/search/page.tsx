import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import SearchClient from "./search-client";

export const metadata: Metadata = {
  title: "Search Listings — NextBazar",
  description: "Search and browse thousands of listings on NextBazar.",
};

export default async function SearchPage() {
  const [categories, subcategories, locations] = await Promise.all([
    getCategoriesCached(),
    getSubcategoriesCached(),
    getLocationsCached(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">
          Loading...
        </div>
      }
    >
      <SearchClient
        initialCategories={categories}
        initialSubcategories={subcategories}
        initialLocations={locations}
      />
    </Suspense>
  );
}
