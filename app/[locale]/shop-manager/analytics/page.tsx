"use client";

import AnalyticsTab from "../../dashboard/dealer/analytics-tab";
import { useShopCMS } from "../shop-context";

export default function ShopAnalyticsPage() {
  const { listings } = useShopCMS();
  return <AnalyticsTab listings={listings} />;
}
