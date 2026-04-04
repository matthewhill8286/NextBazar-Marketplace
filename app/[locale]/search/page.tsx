import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import SearchClient from "./search-client";

export const metadata: Metadata = {
  title: "Search Listings — NextBazar",
  description: "Search and browse thousands of listings on NextBazar.",
  alternates: buildAlternates("/search"),
};

export default async function SearchPage() {
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
