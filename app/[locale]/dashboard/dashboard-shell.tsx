"use client";

import type {
  Category,
  DashboardListing,
  Location,
  Subcategory,
} from "@/lib/supabase/supabase.types";
import { DashboardProvider } from "./dashboard-context";
import ShopDataLoader from "./shop-data-loader";

/**
 * Thin client wrapper — receives server-fetched data via props and
 * provides it to child pages through DashboardContext.
 *
 * For Pro Sellers, also wraps with ShopDataLoader so the shop context
 * (inventory, analytics, offers, branding) is available on Pro Seller pages.
 */
export default function DashboardShell({
  listings,
  isDealer,
  isProSeller,
  categories,
  subcategories,
  locations,
  children,
}: {
  listings: DashboardListing[];
  isDealer: boolean;
  isProSeller: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  locations: Location[];
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider
      value={{
        listings,
        isDealer,
        isProSeller,
        categories,
        subcategories,
        locations,
      }}
    >
      {isProSeller ? <ShopDataLoader>{children}</ShopDataLoader> : children}
    </DashboardProvider>
  );
}
