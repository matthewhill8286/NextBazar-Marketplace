import { createClient } from "@/lib/supabase/server";
import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import type { AnalyticsRow, OfferRow } from "@/app/[locale]/dashboard/shop-context";

const LISTING_SELECT = `
  id, title, slug, price, currency, price_type, condition, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, is_urgent, promoted_until, created_at, updated_at, expires_at,
  category_id, location_id,
  quantity, low_stock_threshold,
  categories(name, slug, icon),
  locations(name)
`;

export async function loadDashboardData(userId: string) {
  const supabase = await createClient();
  const analyticsSince = new Date(Date.now() - 90 * 86400000)
    .toISOString()
    .split("T")[0];

  const [
    { data: prof },
    { data: listingData },
    { data: shopData },
    { data: offersData },
    categories,
    subcategories,
    locations,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, is_pro_seller, email, avatar_url, verified")
      .eq("id", userId)
      .single(),
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("dealer_shops").select("*").eq("user_id", userId).single(),
    supabase
      .from("offers")
      .select("id, listing_id, amount, status, created_at, responded_at")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false }),
    getCategoriesCached(),
    getSubcategoriesCached(),
    getLocationsCached(),
  ]);

  const listings: DashboardListing[] =
    (listingData as DashboardListing[]) || [];
  const isDealer = prof?.is_pro_seller || false;
  const isProSeller = !!isDealer && shopData?.plan_status === "active";
  const planTier = (
    isProSeller && shopData?.plan_tier ? shopData.plan_tier : "starter"
  ) as import("@/lib/pricing-config").SellerTier;

  let analyticsData: AnalyticsRow[] = [];
  if (isProSeller && listings.length > 0) {
    const listingIds = listings.map((l) => l.id);
    const { data } = await supabase
      .from("listing_analytics")
      .select("listing_id, date, views, favorites, messages")
      .gte("date", analyticsSince)
      .in("listing_id", listingIds)
      .order("date", { ascending: true });
    analyticsData = (data ?? []) as AnalyticsRow[];
  }

  const isAdmin = ["matthill8286@gmail.com"].includes(prof?.email || "");

  return {
    listings,
    isDealer,
    isProSeller,
    planTier,
    categories,
    subcategories,
    locations,
    shopData: isProSeller
      ? {
          shop: shopData,
          listings: listings as unknown as import("@/app/[locale]/dashboard/dealer/types").ListingRow[],
          profile: prof
            ? {
                display_name: prof.display_name,
                is_pro_seller: prof.is_pro_seller,
              }
            : null,
          offers: (offersData ?? []) as OfferRow[],
          analytics: analyticsData,
          userId,
        }
      : null,
    sidebarProfile: {
      display_name: prof?.display_name || "User",
      email: prof?.email || "",
      avatar_url: prof?.avatar_url || null,
      verified: prof?.verified || false,
      is_pro_seller: prof?.is_pro_seller || false,
      plan_tier: shopData?.plan_tier || null,
    },
    isAdmin,
  };
}
