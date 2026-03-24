import type { Metadata } from "next";
import {
  getCategoryBySlugCached,
  getCategoryListingsCached,
  getCategoryStatsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import PropertiesClient from "./properties-client";

export const metadata: Metadata = {
  title: "Properties for Sale & Rent in Cyprus — NextBazar",
  description:
    "Browse houses, apartments, land, and commercial properties for sale and rent across Cyprus. New developments, existing builds, and rental listings.",
};

export const revalidate = 60;

export default async function PropertiesPage() {
  const category = await getCategoryBySlugCached("property");
  if (!category) return <div className="p-20 text-center text-gray-400">Category not found.</div>;

  const [subcategories, featured, recent, stats] = await Promise.all([
    getSubcategoriesCached(),
    getCategoryListingsCached(category.id, { promoted: true, limit: 12 }),
    getCategoryListingsCached(category.id, { limit: 12 }),
    getCategoryStatsCached(category.id),
  ]);

  // Only subcategories belonging to this category
  const propertySubcategories = subcategories.filter(
    (sc) => sc.category_id === category.id,
  );

  return (
    <PropertiesClient
      category={category}
      subcategories={propertySubcategories}
      featuredListings={featured}
      recentListings={recent}
      stats={stats}
    />
  );
}
