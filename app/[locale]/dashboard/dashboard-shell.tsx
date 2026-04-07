"use client";

import type { SellerTier } from "@/lib/pricing-config";
import type {
  Category,
  DashboardListing,
  Location,
  Subcategory,
} from "@/lib/supabase/supabase.types";
import { DashboardProvider } from "./dashboard-context";
import type { ShopInitialData } from "./shop-data-loader";
import ShopDataLoader from "./shop-data-loader";

/**
 * Thin client wrapper — receives server-fetched data via props and
 * provides it to child pages through DashboardContext.
 *
 * For Pro Sellers, also wraps with ShopDataLoader so the shop context
 * (inventory, analytics, offers, branding) is available on Pro Seller pages.
 * Server-fetched shopData is passed as hydration seed to avoid a redundant
 * client-side fetch on initial load.
 */
export default function DashboardShell({
  listings,
  isDealer,
  isProSeller,
  planTier,
  categories,
  subcategories,
  locations,
  shopData,
  children,
}: {
  listings: DashboardListing[];
  isDealer: boolean;
  isProSeller: boolean;
  planTier: SellerTier;
  categories: Category[];
  subcategories: Subcategory[];
  locations: Location[];
  shopData?: ShopInitialData | null;
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider
      value={{
        listings,
        isDealer,
        isProSeller,
        planTier,
        categories,
        subcategories,
        locations,
      }}
    >
      {isProSeller ? (
        <ShopDataLoader initialData={shopData ?? undefined}>
          {children}
        </ShopDataLoader>
      ) : (
        children
      )}
    </DashboardProvider>
  );
}
