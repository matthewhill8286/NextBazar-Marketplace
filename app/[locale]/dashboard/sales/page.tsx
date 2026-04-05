"use client";

import { Loader2 } from "lucide-react";
import SalesTab from "../dealer/sales-tab";
import { useShopCMS } from "../shop-context";

export default function DashboardSalesPage() {
  const { listings, loading } = useShopCMS();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#8a8280]" />
      </div>
    );
  }

  return <SalesTab listings={listings} shopMode />;
}
