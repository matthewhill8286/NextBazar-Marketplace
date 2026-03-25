"use client";

import { Car, Sparkles, Store, User } from "lucide-react";
import CategoryLanding, { type TabConfig } from "@/app/components/category-landing";
import type { ListingCardRow, Subcategory } from "@/lib/supabase/supabase.types";

const TABS: TabConfig[] = [
  {
    key: "new",
    label: "New Cars",
    icon: Sparkles,
    description:
      "Browse brand-new vehicles from authorised sellers — latest models, full warranties, and financing options available.",
    subcategorySlugs: [
      "new-car",
      "new-vehicle",
      "new",
      "brand-new",
      "dealer-new",
    ],
  },
  {
    key: "used",
    label: "Used Cars",
    icon: Car,
    description:
      "Find quality pre-owned vehicles from private sellers and certified Pro Sellers — inspected, priced fairly, and ready to drive.",
    subcategorySlugs: [
      "used-car",
      "used-vehicle",
      "used",
      "pre-owned",
      "second-hand",
      "car",
      "motorcycle",
      "suv",
      "truck",
      "van",
    ],
  },
  {
    key: "dealers",
    label: "Pro Seller Showrooms",
    icon: Store,
    description:
      "Shop directly from trusted Pro Sellers — browse their full inventory, compare prices, and get exclusive deals.",
    subcategorySlugs: [
      "dealer",
      "showroom",
      "dealership",
      "certified-dealer",
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
    />
  );
}
