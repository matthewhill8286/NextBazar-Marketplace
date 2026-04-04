import type { Metadata } from "next";
import {
  getCategoryBySlugCached,
  getCategoryListingsCached,
  getShopsByCategoryCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import VehiclesClient from "./vehicles-client";

export const metadata: Metadata = {
  title: "Cars & Vehicles for Sale in Cyprus — NextBazar",
  description:
    "Browse new and used cars, motorcycles, and commercial vehicles from private sellers and Pro Sellers across Cyprus.",
};

export default async function VehiclesPage() {
  const category = await getCategoryBySlugCached("vehicles");
  if (!category)
    return (
      <div className="p-20 text-center text-[#8a8280]">Category not found.</div>
    );

  const [subcategories, featured, recent, categoryShops] = await Promise.all([
    getSubcategoriesCached(),
    getCategoryListingsCached(category.id, { promoted: true, limit: 24 }),
    getCategoryListingsCached(category.id, { limit: 48 }),
    getShopsByCategoryCached(category.id),
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
      categoryShops={categoryShops}
    />
  );
}
