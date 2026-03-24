import type { Metadata } from "next";
import {
  getCategoryBySlugCached,
  getCategoryListingsCached,
  getCategoryStatsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import VehiclesClient from "./vehicles-client";

export const metadata: Metadata = {
  title: "Cars & Vehicles for Sale in Cyprus — NextBazar",
  description:
    "Browse new and used cars, motorcycles, and commercial vehicles from private sellers and dealers across Cyprus.",
};

export const revalidate = 60;

export default async function VehiclesPage() {
  const category = await getCategoryBySlugCached("vehicles");
  if (!category) return <div className="p-20 text-center text-gray-400">Category not found.</div>;

  const [subcategories, featured, recent, stats] = await Promise.all([
    getSubcategoriesCached(),
    getCategoryListingsCached(category.id, { promoted: true, limit: 12 }),
    getCategoryListingsCached(category.id, { limit: 12 }),
    getCategoryStatsCached(category.id),
  ]);

  const vehicleSubcategories = subcategories.filter(
    (sc) => sc.category_id === category.id,
  );

  return (
    <VehiclesClient
      category={category}
      subcategories={vehicleSubcategories}
      featuredListings={featured}
      recentListings={recent}
      stats={stats}
    />
  );
}
