import VehiclesClient from "@/app/[locale]/vehicles/vehicles-client";
import {
  getCategoryBySlugCached,
  getCategoryListingsCached,
  getShopsByCategoryCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import type { Route } from "./+types/vehicles";

export function meta() {
  return [
    { title: "Cars & Vehicles for Sale in Cyprus — NextBazar" },
    { name: "description", content: "Browse new and used cars, motorcycles, and commercial vehicles from private sellers and Pro Sellers across Cyprus." },
  ];
}

export async function loader() {
  const category = await getCategoryBySlugCached("vehicles");
  if (!category) return { category: null, subcategories: [], featured: [], recent: [], shops: [] };
  const [subcategories, featured, recent, shops] = await Promise.all([
    getSubcategoriesCached(),
    getCategoryListingsCached(category.id, { promoted: true, limit: 24 }),
    getCategoryListingsCached(category.id, { limit: 48 }),
    getShopsByCategoryCached(category.id),
  ]);
  return {
    category,
    subcategories: subcategories.filter((sc) => sc.category_id === category.id),
    featured,
    recent,
    shops,
  };
}

export default function VehiclesPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData.category) {
    return <div className="p-20 text-center text-[#8a8280]">Category not found.</div>;
  }
  return (
    <VehiclesClient
      category={loaderData.category}
      subcategories={loaderData.subcategories}
      featuredListings={loaderData.featured}
      recentListings={loaderData.recent}
      categoryShops={loaderData.shops}
    />
  );
}
