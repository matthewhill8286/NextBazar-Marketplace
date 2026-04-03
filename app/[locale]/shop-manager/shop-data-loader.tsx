"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { ListingRow } from "../dashboard/dealer/types";
import { ShopCMSProvider } from "./shop-context";
import type { AnalyticsRow, OfferRow } from "./shop-context";

type DealerShop = Tables<"dealer_shops">;

const LISTING_SELECT = `
  id, title, slug, price, currency, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, created_at, updated_at,
  category_id, location_id,
  quantity, low_stock_threshold,
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
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    is_pro_seller: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // 90 days of analytics for rich charting
    const since = new Date(Date.now() - 90 * 86400000)
      .toISOString()
      .split("T")[0];

    const [shopRes, listingsRes, profileRes, analyticsRes, offersRes] =
      await Promise.all([
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
        supabase
          .from("listing_analytics")
          .select("listing_id, date, views, favorites, messages")
          .gte("date", since)
          .in(
            "listing_id",
            (
              await supabase
                .from("listings")
                .select("id")
                .eq("user_id", userId)
            ).data?.map((l) => l.id) ?? [],
          )
          .order("date", { ascending: true }),
        supabase
          .from("offers")
          .select("id, listing_id, amount, status, created_at, responded_at")
          .eq("seller_id", userId)
          .order("created_at", { ascending: false }),
      ]);

    if (shopRes.data) setShop(shopRes.data);
    if (listingsRes.data)
      setListings(listingsRes.data as unknown as ListingRow[]);
    if (profileRes.data) setProfile(profileRes.data);
    if (analyticsRes.data)
      setAnalytics(analyticsRes.data as AnalyticsRow[]);
    if (offersRes.data) setOffers(offersRes.data as OfferRow[]);
    setLoading(false);
  }, [userId, supabase]);

  /** Soft refresh — re-fetches listings only, no skeleton flash */
  const refreshListings = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setListings(data as unknown as ListingRow[]);
  }, [userId, supabase]);

  useEffect(() => {
    if (!authLoading && userId) load();
  }, [authLoading, userId, load]);

  return (
    <ShopCMSProvider
      value={{
        shop,
        listings,
        analytics,
        offers,
        profile,
        userId: userId ?? "",
        loading: authLoading || loading,
        refresh: load,
        refreshListings,
      }}
    >
      {children}
    </ShopCMSProvider>
  );
}
