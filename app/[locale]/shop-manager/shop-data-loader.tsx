"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { ListingRow } from "../dashboard/dealer/types";
import { ShopCMSProvider } from "./shop-context";

type DealerShop = Tables<"dealer_shops">;

const LISTING_SELECT = `
  id, title, slug, price, currency, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, created_at, updated_at,
  category_id, location_id,
  categories(name, slug, icon),
  locations(name)
`;

/**
 * Client-side data loader that fetches shop, listings, and profile,
 * then provides them via ShopCMSContext to all child routes.
 */
export default function ShopDataLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<DealerShop | null>(null);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    is_pro_seller: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [shopRes, listingsRes, profileRes] = await Promise.all([
      supabase
        .from("dealer_shops")
        .select("*")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("listings")
        .select(LISTING_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("display_name, is_pro_seller")
        .eq("id", userId)
        .single(),
    ]);

    if (shopRes.data) setShop(shopRes.data);
    if (listingsRes.data)
      setListings(listingsRes.data as unknown as ListingRow[]);
    if (profileRes.data) setProfile(profileRes.data);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (!authLoading && userId) load();
  }, [authLoading, userId, load]);

  return (
    <ShopCMSProvider
      value={{
        shop,
        listings,
        profile,
        userId: userId ?? "",
        loading: authLoading || loading,
        refresh: load,
      }}
    >
      {children}
    </ShopCMSProvider>
  );
}
