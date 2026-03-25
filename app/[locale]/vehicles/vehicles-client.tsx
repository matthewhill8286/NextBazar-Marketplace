"use client";

import { Bike, Car, Cog, Store, Truck } from "lucide-react";
import CategoryLanding, { type TabConfig } from "@/app/components/category-landing";
import type { ListingCardRow, Subcategory } from "@/lib/supabase/supabase.types";

const TABS: TabConfig[] = [
  {
    key: "cars",
    label: "Cars",
    icon: Car,
    description:
      "Browse new and used cars from private sellers and certified Pro Sellers — inspected, priced fairly, and ready to drive.",
    subcategorySlugs: ["cars"],
  },
  {
    key: "motorcycles",
    label: "Motorcycles & More",
    icon: Bike,
    description:
      "Explore motorcycles, trucks, vans, boats, and bicycles from sellers across Cyprus.",
    subcategorySlugs: ["motorcycles", "trucks-vans", "boats", "bicycles"],
  },
  {
    key: "parts",
    label: "Parts & Accessories",
    icon: Cog,
    description:
      "Find quality auto parts, accessories, tyres, and aftermarket upgrades for all vehicle types.",
    subcategorySlugs: ["parts-accessories"],
  },
  {
    key: "dealers",
    label: "Pro Seller Showrooms",
    icon: Store,
    description:
      "Shop directly from trusted Pro Sellers — browse their full inventory, compare prices, and get exclusive deals.",
    subcategorySlugs: [],
    filterByDealer: true,
  },
];

type Props = {
  category: { id: string; name: string; slug: string; icon: string | null };
  subcategories: Subcategory[];
  featuredListings: ListingCardRow[];
  recentListings: ListingCardRow[];
  stats: { total: number; newThisWeek: number; avgPrice: number };
};

export default function VehiclesClient({
  category,
  subcategories,
  featuredListings,
  recentListings,
  stats,
}: Props) {
  return (
    <CategoryLanding
      categorySlug={category.slug}
      categoryName="Vehicles"
      headline="Buy & Sell Cars in Cyprus"
      subheadline="From brand-new models to quality used cars and trusted dealer showrooms — find your next ride or reach thousands of buyers."
      tabs={TABS}
      stats={stats}
      subcategories={subcategories}
      featuredListings={featuredListings}
      recentListings={recentListings}
      currency="€"
      postLabel="List a Vehicle"
      heroImage={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/vehicles-hero.jpg`}
    />
  );
}
