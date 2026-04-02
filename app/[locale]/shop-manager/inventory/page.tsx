"use client";

import InventoryTab from "../../dashboard/dealer/inventory-tab";
import { useShopCMS } from "../shop-context";

export default function ShopInventoryPage() {
  const { listings, refreshListings } = useShopCMS();
  return (
    <InventoryTab
      listings={listings}
      editBaseHref="/shop-manager/edit"
      newListingHref="/shop-manager/inventory/new"
      newListingLabel="Add Inventory"
      onRefresh={refreshListings}
    />
  );
}
