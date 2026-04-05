"use client";

import { Loader2 } from "lucide-react";
import type { SellerTier } from "@/lib/pricing-config";
import InventoryTab from "../dealer/inventory-tab";
import { useShopCMS } from "../shop-context";

export default function DashboardInventoryPage() {
  const { listings, refreshListings, shop, loading } = useShopCMS();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#8a8280]" />
      </div>
    );
  }

  return (
    <InventoryTab
      listings={listings}
      planTier={(shop?.plan_tier as SellerTier) || "starter"}
      planStartedAt={shop?.plan_started_at}
      editBaseHref="/dashboard/edit"
      newListingHref="/dashboard/inventory/new"
      newListingLabel="Add Listing"
      onRefresh={refreshListings}
    />
  );
}
