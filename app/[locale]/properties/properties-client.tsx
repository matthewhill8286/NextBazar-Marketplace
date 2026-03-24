"use client";

import { Building, Building2, Hammer, Key } from "lucide-react";
import CategoryLanding, { type TabConfig } from "@/app/components/category-landing";
import type { ListingCardRow, Subcategory } from "@/lib/supabase/supabase.types";

const TABS: TabConfig[] = [
  {
    key: "buy",
    label: "Buy",
    icon: Building2,
    description:
      "Find your dream home — browse apartments, houses, villas, land plots, and commercial properties for sale across Cyprus.",
    subcategorySlugs: [
      "apartment-sale",
      "house-sale",
      "villa-sale",
      "land",
      "commercial-sale",
      "apartment",
      "house",
      "villa",
    ],
  },
  {
    key: "rent",
    label: "Rent",
    icon: Key,
    description:
      "Discover long-term and short-term rental properties — apartments, houses, offices, and holiday lets.",
    subcategorySlugs: [
      "apartment-rent",
      "house-rent",
      "villa-rent",
      "office-rent",
      "commercial-rent",
      "short-term",
      "holiday-let",
      "rental",
      "rent",
    ],
  },
  {
    key: "new-developments",
    label: "New Developments",
    icon: Hammer,
    description:
      "Explore off-plan and newly built projects from trusted developers — modern designs, payment plans, and early-bird pricing.",
    subcategorySlugs: [
      "new-development",
      "off-plan",
      "new-build",
      "project",
      "development",
    ],
  },
];

type Props = {
  category: { id: string; name: string; slug: string; icon: string | null };
  subcategories: Subcategory[];
  featuredListings: ListingCardRow[];
  recentListings: ListingCardRow[];
  stats: { total: number; newThisWeek: number; avgPrice: number };
};

export default function PropertiesClient({
  category,
  subcategories,
  featuredListings,
  recentListings,
  stats,
}: Props) {
  return (
    <CategoryLanding
      categorySlug={category.slug}
      categoryName="Properties"
      headline="Find Your Perfect Property in Cyprus"
      subheadline="Whether you're buying your first home, looking for a rental, or investing in new developments — discover thousands of properties across the island."
      tabs={TABS}
      stats={stats}
      subcategories={subcategories}
      featuredListings={featuredListings}
      recentListings={recentListings}
      currency="€"
      postLabel="List a Property"
    />
  );
}
