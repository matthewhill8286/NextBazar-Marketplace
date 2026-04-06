"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { ListingRow } from "./dealer/types";
import type { AnalyticsRow, OfferRow } from "./shop-context";
import { ShopCMSProvider } from "./shop-context";

type DealerShop = Tables<"dealer_shops">;

const LISTING_SELECT = `
  id, title, slug, price, currency, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, promoted_until, created_at, updated_at,
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
  const pathname = usePathname();
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

    try {
      // 90 days of analytics for rich charting
      const since = new Date(Date.now() - 90 * 86400000)
        .toISOString()
        .split("T")[0];

      // Step 1: Fetch shop, listings, profile, and offers in parallel
      const [shopRes, listingsRes, profileRes, offersRes] =
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
            .from("offers")
            .select("id, listing_id, amount, status, created_at, responded_at")
            .eq("seller_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      // Step 2: Use listing IDs from step 1 to fetch analytics (no extra round-trip)
      const listingIds = (listingsRes.data ?? []).map((l: { id: string }) => l.id);
      const analyticsRes = listingIds.length > 0
        ? await supabase
            .from("listing_analytics")
            .select("listing_id, date, views, favorites, messages")
            .gte("date", since)
            .in("listing_id", listingIds)
            .order("date", { ascending: true })
        : { data: [] as AnalyticsRow[], error: null };

      // Surface query errors in the console instead of silently swallowing them
      if (shopRes.error)
        console.error("[ShopDataLoader] shop query:", shopRes.error.message);
      if (listingsRes.error)
        console.error(
          "[ShopDataLoader] listings query:",
          listingsRes.error.message,
        );
      if (profileRes.error)
        console.error(
          "[ShopDataLoader] profile query:",
          profileRes.error.message,
        );
      if (analyticsRes.error)
        console.error(
          "[ShopDataLoader] analytics query:",
          analyticsRes.error.message,
        );
      if (offersRes.error)
        console.error(
          "[ShopDataLoader] offers query:",
          offersRes.error.message,
        );

      if (shopRes.data) setShop(shopRes.data);
      if (listingsRes.data)
        setListings(listingsRes.data as unknown as ListingRow[]);
      if (profileRes.data) setProfile(profileRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data as AnalyticsRow[]);
      if (offersRes.data) setOffers(offersRes.data as OfferRow[]);
    } catch (err) {
      console.error("[ShopDataLoader] unexpected error:", err);
    }
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

  // Initial load
  useEffect(() => {
    if (!authLoading && userId) load();
  }, [authLoading, userId, load]);

  // Soft-refresh listings when navigating back (e.g. from edit page)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    // After first mount, any pathname change triggers a soft refresh
    if (userId) refreshListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
