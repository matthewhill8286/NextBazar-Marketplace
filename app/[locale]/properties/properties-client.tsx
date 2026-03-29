"use client";

import { Building2, Hammer, Key } from "lucide-react";
import CategoryLanding, {
  type TabConfig,
} from "@/app/components/category-landing";
import type {
  ListingCardRow,
  Subcategory,
} from "@/lib/supabase/supabase.types";

const TABS: TabConfig[] = [
  {
    key: "buy",
    label: "Buy",
    icon: Building2,
    description:
      "Find your dream home — browse apartments, houses, villas, land plots, and commercial properties for sale across Cyprus.",
    subcategorySlugs: ["for-sale", "commercial", "land"],
  },
  {
    key: "rent",
    label: "Rent",
    icon: Key,
    description:
      "Discover long-term and short-term rental properties — apartments, houses, offices, and holiday lets across Cyprus.",
    subcategorySlugs: ["for-rent"],
  },
  {
    key: "new-developments",
    label: "New Developments",
    icon: Hammer,
    description:
      "Explore off-plan and newly built projects from trusted developers — modern designs, payment plans, and early-bird pricing.",
    subcategorySlugs: ["new-developments"],
  },
];

type Props = {
  category: { id: string; name: string; slug: string; icon: string | null };
  subcategories: Subcategory[];
  featuredListings: ListingCardRow[];
  recentListings: ListingCardRow[];
};

export default function PropertiesClient({
  category,
  subcategories,
  featuredListings,
  recentListings,
}: Props) {
  return (
    <CategoryLanding
      categorySlug={category.slug}
      categoryName="Properties"
      headline="Find Your Perfect Property in Cyprus"
      subheadline="Whether you're buying your first home, looking for a rental, or investing in new developments — discover thousands of properties across the island."
      tabs={TABS}
      subcategories={subcategories}
      featuredListings={featuredListings}
      recentListings={recentListings}
      currency="€"
      postLabel="List a Property"
      heroImage={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/property-hero.jpg`}
    />
  );
}
