import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import DashboardShell from "./dashboard-shell";
import type { AnalyticsRow, OfferRow } from "./shop-context";

const LISTING_SELECT = `
  id, title, slug, price, currency, price_type, condition, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, is_urgent, promoted_until, created_at, updated_at, expires_at,
  category_id, location_id,
  quantity, low_stock_threshold,
  categories(name, slug, icon),
  locations(name)
`;

/**
 * Async server component that fetches listings + dealer status + shop data,
 * then wraps children in DashboardContext via DashboardShell.
 * Wrapped in <Suspense> by the layout so the page skeleton (loading.tsx)
 * shows instantly while this streams in.
 *
 * For Pro Sellers, also pre-fetches the full data that ShopDataLoader needs
 * (shop, profile, offers, analytics) so it can hydrate instantly without a
 * redundant client-side fetch.
 */
export default async function DashboardDataProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 90 days of analytics for rich charting
  const analyticsSince = new Date(Date.now() - 90 * 86400000)
    .toISOString()
    .split("T")[0];

  // Step 1 — parallel fetch of everything (including full shop row for Pro Sellers)
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
      .select("display_name, is_pro_seller")
      .eq("id", userId)
      .single(),
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("dealer_shops")
      .select("*")
      .eq("user_id", userId)
      .single(),
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
  const planTier = (isProSeller && shopData?.plan_tier
    ? shopData.plan_tier
    : "starter") as import("@/lib/pricing-config").SellerTier;

  // Step 2 — analytics depend on listing IDs from step 1
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

  return (
    <DashboardShell
      listings={listings}
      isDealer={isDealer}
      isProSeller={isProSeller}
      planTier={planTier}
      categories={categories}
      subcategories={subcategories}
      locations={locations}
      shopData={isProSeller ? {
        shop: shopData,
        listings: listings as unknown as import("./dealer/types").ListingRow[],
        profile: prof ? { display_name: prof.display_name, is_pro_seller: prof.is_pro_seller } : null,
        offers: (offersData ?? []) as OfferRow[],
        analytics: analyticsData,
        userId,
      } : null}
    >
      {children}
    </DashboardShell>
  );
}
