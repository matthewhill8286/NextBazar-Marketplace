import { createClient } from "@/lib/supabase/server";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import DashboardShell from "./dashboard-shell";

const LISTING_SELECT = `
  id, title, slug, price, currency, price_type, condition, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, is_urgent, promoted_until, created_at, expires_at,
  category_id, location_id,
  quantity, low_stock_threshold,
  categories(name, slug, icon),
  locations(name)
`;

/**
 * Async server component that fetches listings + dealer status,
 * then wraps children in DashboardContext via DashboardShell.
 * Wrapped in <Suspense> by the layout so the page skeleton (loading.tsx)
 * shows instantly while this streams in.
 */
export default async function DashboardDataProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: prof }, { data: listingData }, { data: shop }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("is_pro_seller")
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
        .select("plan_status")
        .eq("user_id", userId)
        .single(),
    ]);

  const listings: DashboardListing[] =
    (listingData as DashboardListing[]) || [];
  const isDealer = prof?.is_pro_seller || false;
  const isProSeller = !!isDealer && shop?.plan_status === "active";

  return (
    <DashboardShell
      listings={listings}
      isDealer={isDealer}
      isProSeller={isProSeller}
    >
      {children}
    </DashboardShell>
  );
}
