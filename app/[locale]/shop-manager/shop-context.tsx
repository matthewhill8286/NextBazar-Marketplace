"use client";

import { createContext, useContext } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import type { ListingRow } from "../dashboard/dealer/types";

type DealerShop = Tables<"dealer_shops">;

export type ShopCMSData = {
  shop: DealerShop | null;
  listings: ListingRow[];
  profile: { display_name: string | null; is_pro_seller: boolean } | null;
  userId: string;
  loading: boolean;
  /** Re-fetch everything (shows skeleton) */
  refresh: () => void;
  /** Re-fetch listings only without showing skeleton */
  refreshListings: () => Promise<void>;
};

const ShopCMSContext = createContext<ShopCMSData>({
  shop: null,
  listings: [],
  profile: null,
  userId: "",
  loading: true,
  refresh: () => {},
  refreshListings: () => Promise.resolve(),
});

export const ShopCMSProvider = ShopCMSContext.Provider;

export function useShopCMS() {
  return useContext(ShopCMSContext);
}
