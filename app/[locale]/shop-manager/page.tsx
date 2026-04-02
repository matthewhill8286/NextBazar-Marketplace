"use client";

import OverviewTab from "../dashboard/dealer/overview-tab";
import { useShopCMS } from "./shop-context";

export default function ShopManagerOverview() {
  const { shop, listings } = useShopCMS();
  return <OverviewTab listings={listings} slug={shop?.slug ?? ""} />;
}
