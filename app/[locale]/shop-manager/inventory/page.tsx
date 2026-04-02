"use client";

import InventoryTab from "../../dashboard/dealer/inventory-tab";
import { useShopCMS } from "../shop-context";

export default function ShopInventoryPage() {
  const { listings } = useShopCMS();
  return <InventoryTab listings={listings} editBaseHref="/shop-manager/edit" />;
}
