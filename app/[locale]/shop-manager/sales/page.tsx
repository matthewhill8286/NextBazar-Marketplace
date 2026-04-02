"use client";

import SalesTab from "../../dashboard/dealer/sales-tab";
import { useShopCMS } from "../shop-context";

export default function ShopSalesPage() {
  const { listings } = useShopCMS();
  return <SalesTab listings={listings} />;
}
