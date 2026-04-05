"use client";

import InventoryTab from "../../dashboard/dealer/inventory-tab";
import type { SellerTier } from "@/lib/pricing-config";
import { useShopCMS } from "../shop-context";

export default function ShopInventoryPage() {
  const { listings, refreshListings, shop } = useShopCMS();
  return (
    <InventoryTab
      listings={listings}
      planTier={(shop?.plan_tier as SellerTier) || "starter"}
      planStartedAt={shop?.plan_started_at}
      editBaseHref="/shop-manager/edit"
      newListingHref="/shop-manager/inventory/new"
      newListingLabel="Add Inventory"
      onRefresh={refreshListings}
    />
  );
}
