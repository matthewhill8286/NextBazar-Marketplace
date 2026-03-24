import { createClient } from "@/lib/supabase/server";
import { CARD_SELECT } from "@/lib/supabase/selects";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";
import ShopHome from "./shop-home";

export const revalidate = 60;

/**
 * Standalone shop homepage — rendered when a buyer visits the dealer's
 * subdomain (e.g. toyota-cyprus.nextbazar.com).
 */
export default async function StandaloneShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get the shop to find user_id
  const { data: shop } = await supabase
    .from("dealer_shops")
    .select("user_id, shop_name, description, banner_url, accent_color")
    .eq("slug", slug)
    .eq("plan_status", "active")
    .single();

  if (!shop) return null; // Layout already handles notFound

  // Fetch listings + profile in parallel
  const [{ data: listings }, { data: profile }] = await Promise.all([
    supabase
      .from("listings")
      .select(CARD_SELECT)
      .eq("user_id", shop.user_id)
      .eq("status", "active")
      .order("is_promoted", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("display_name, avatar_url, verified, is_dealer, created_at")
      .eq("id", shop.user_id)
      .single(),
  ]);

  return (
    <ShopHome
      shop={shop}
      listings={(listings ?? []) as unknown as ListingCardRow[]}
      profile={profile}
    />
  );
}
