import PropertiesClient from "@/app/[locale]/properties/properties-client";
import {
  getCategoryBySlugCached,
  getCategoryListingsCached,
  getShopsByCategoryCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import type { Route } from "./+types/properties";

export function meta() {
  return [
    { title: "Properties for Sale & Rent in Cyprus — NextBazar" },
    { name: "description", content: "Browse houses, apartments, land, and commercial properties for sale and rent across Cyprus." },
  ];
}

export async function loader() {
  const category = await getCategoryBySlugCached("property");
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

export default function PropertiesPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData.category) {
    return <div className="p-20 text-center text-[#8a8280]">Category not found.</div>;
  }
  return (
    <PropertiesClient
      category={loaderData.category}
      subcategories={loaderData.subcategories}
      featuredListings={loaderData.featured}
      recentListings={loaderData.recent}
      categoryShops={loaderData.shops}
    />
  );
}
