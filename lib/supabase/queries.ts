import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { FEATURE_FLAGS, SOFT_LAUNCH_CATEGORY_SLUGS } from "@/lib/feature-flags";
import { CARD_SELECT } from "./constants";
import { createClient } from "./server";
import type {
  Category,
  ListingCardRow,
  ListingDetailRow,
  Location,
  Subcategory,
} from "./supabase.types";

// Re-export so existing server-side consumers keep working.
export { CARD_SELECT };

// ─── Public (no-auth) Supabase client ────────────────────────────────────────
// Used inside cached functions so we don't pull in the cookies() dynamic API.
function publicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ─── Cached reference data (revalidate: 1 hour) ───────────────────────────────

export async function getCategoriesCached(): Promise<Category[]> {
  "use cache";
  cacheLife("reference");
  cacheTag("categories");

  let q = publicClient().from("categories").select("*");

  if (FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES) {
    q = q.in("slug", [...SOFT_LAUNCH_CATEGORY_SLUGS]);
  }

  const { data } = await q.order("sort_order");
  return (data ?? []) as Category[];
}

export async function getSubcategoriesCached(): Promise<Subcategory[]> {
  "use cache";
  cacheLife("reference");
  cacheTag("subcategories");

  if (FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES) {
    // Fetch only subcategories whose parent category is in the allowed set
    const allowedCategories = await getCategoriesCached();
    const allowedCategoryIds = allowedCategories.map((c) => c.id);

    const { data } = await publicClient()
      .from("subcategories")
      .select("id, category_id, name, slug")
      .in("category_id", allowedCategoryIds)
      .order("sort_order");
    return (data ?? []) as Subcategory[];
  }

  const { data } = await publicClient()
    .from("subcategories")
    .select("id, category_id, name, slug")
    .order("sort_order");
  return (data ?? []) as Subcategory[];
}

export async function getLocationsCached(): Promise<Location[]> {
  "use cache";
  cacheLife("reference");
  cacheTag("locations");

  const { data } = await publicClient()
    .from("locations")
    .select("id, name, slug")
    .order("sort_order");
  return (data ?? []) as Location[];
}

// ─── Cached pricing data (revalidate: 5 min) ─────────────────────────────────

export type PricingRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string | null;
  duration_days: number | null;
  stripe_price_id: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
};

export async function getPricingCached(): Promise<PricingRow[]> {
  "use cache";
  cacheLife("pricing");
  cacheTag("pricing");

  const { data } = await publicClient()
    .from("pricing")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as PricingRow[];
}

/** Convenience: returns a map keyed by pricing.key (e.g. "featured", "urgent", "dealer_pro") */
export async function getPricingMap(): Promise<Record<string, PricingRow>> {
  const rows = await getPricingCached();
  return Object.fromEntries(rows.map((r) => [r.key, r]));
}

// ─── Cached home-page listing data (revalidate: 60 s) ────────────────────────

export async function getFeaturedListingsCached(): Promise<ListingCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings");

  const { data } = await publicClient()
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("is_promoted", true)
    .order("created_at", { ascending: false })
    .limit(4);
  return (data ?? []) as unknown as ListingCardRow[];
}

export async function getRecentListingsCached(): Promise<ListingCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings");

  const { data } = await publicClient()
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []) as unknown as ListingCardRow[];
}

export async function getActiveListingCountCached(): Promise<number> {
  "use cache";
  cacheLife("pricing"); // 5 min — count doesn't need to be real-time
  cacheTag("listings");

  const { count } = await publicClient()
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  return count ?? 0;
}

export async function getTrendingListingsCached(): Promise<ListingCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings");

  const { data } = await publicClient()
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(8);
  return (data ?? []) as unknown as ListingCardRow[];
}

// ─── Cached listing detail + related (revalidate: 60 s) ──────────────────────

// Explicit columns — excludes heavy `embedding` (vector, ~6 KB) and
// `search_vector` (tsvector) which are never rendered on the detail page.
const LISTING_DETAIL_SELECT = `
  id, user_id, category_id, subcategory_id, location_id,
  title, slug, description, price, currency, price_type, condition, status,
  primary_image_url, image_count, video_url,
  is_promoted, promoted_until, is_urgent,
  view_count, favorite_count, message_count,
  contact_phone, attributes,
  quantity, low_stock_threshold,
  expires_at, created_at, updated_at,
  categories(name, slug, icon),
  subcategories(name, slug),
  locations(name, slug),
  profiles!listings_user_id_fkey(id, display_name, avatar_url, verified, rating, total_reviews, is_pro_seller, created_at, whatsapp_number, telegram_username),
  listing_images(id, url, thumbnail_url, sort_order)
`;

export async function getListingBySlugCached(
  slug: string,
): Promise<ListingDetailRow | null> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings");

  const { data } = await publicClient()
    .from("listings")
    .select(LISTING_DETAIL_SELECT)
    .eq("slug", slug)
    .single();
  return (data ?? null) as ListingDetailRow | null;
}

export async function getRelatedListingsCached(
  categoryId: string,
  excludeId: string,
): Promise<ListingCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings");

  const { data } = await publicClient()
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(4);
  return (data ?? []) as unknown as ListingCardRow[];
}

// ─── Shop accent color (for branded listing pages) ───────────────────────────

export async function getShopAccentColorCached(
  userId: string,
): Promise<string | null> {
  "use cache";
  cacheLife("listings");
  cacheTag("dealer_shops");

  const { data } = await publicClient()
    .from("dealer_shops")
    .select("accent_color")
    .eq("user_id", userId)
    .eq("plan_status", "active")
    .single();
  return data?.accent_color ?? null;
}

// ─── Seller shop details for enhanced listing template ──────────────────────

export type SellerShopInfo = {
  plan_tier: string;
  shop_name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
};

export async function getSellerShopInfoCached(
  userId: string,
): Promise<SellerShopInfo | null> {
  "use cache";
  cacheLife("listings");
  cacheTag("dealer_shops");

  const { data } = await publicClient()
    .from("dealer_shops")
    .select(
      "plan_tier, shop_name, slug, logo_url, accent_color, description, website, facebook, instagram",
    )
    .eq("user_id", userId)
    .eq("plan_status", "active")
    .single();
  return (data as SellerShopInfo) ?? null;
}

// ─── Combined listing detail page data (single waterfall) ────────────────────
// Fetches listing + related + accent color with only 1 sequential hop
// (listing first, then related & accent in parallel).

export type ListingPageData = {
  listing: ListingDetailRow | null;
  related: ListingCardRow[];
  accentColor: string | null;
  shopSlug: string | null;
};

export async function getListingPageDataCached(
  slug: string,
): Promise<ListingPageData> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings", "dealer_shops");

  const sb = publicClient();

  // 1. Fetch listing (must come first — everything else depends on it)
  const { data: listing } = await sb
    .from("listings")
    .select(LISTING_DETAIL_SELECT)
    .eq("slug", slug)
    .single();

  if (!listing)
    return { listing: null, related: [], accentColor: null, shopSlug: null };

  const typedListing = listing as unknown as ListingDetailRow;
  const profile = typedListing.profiles;
  const isPro = profile && !Array.isArray(profile) && profile.is_pro_seller;

  // 2. Fetch related + accent color in parallel (single hop)
  const [relResult, accentResult] = await Promise.all([
    sb
      .from("listings")
      .select(CARD_SELECT)
      .eq("status", "active")
      .eq("category_id", typedListing.category_id)
      .neq("id", typedListing.id)
      .order("created_at", { ascending: false })
      .limit(4),
    isPro
      ? sb
          .from("dealer_shops")
          .select("slug, accent_color")
          .eq("user_id", typedListing.user_id)
          .eq("plan_status", "active")
          .single()
      : Promise.resolve({ data: null }),
  ]);

  return {
    listing: typedListing,
    related: (relResult.data ?? []) as unknown as ListingCardRow[],
    accentColor: accentResult.data?.accent_color ?? null,
    shopSlug: accentResult.data?.slug ?? null,
  };
}

// ─── Popular listing slugs (for generateStaticParams) ───────────────────────

export async function getPopularListingSlugs(limit = 50): Promise<string[]> {
  "use cache";
  cacheLife("reference");
  cacheTag("listings");

  const { data } = await publicClient()
    .from("listings")
    .select("slug")
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => r.slug);
}

// ─── Category landing page helpers (revalidate: 60 s) ────────────────────────

export async function getCategoryBySlugCached(slug: string) {
  "use cache";
  cacheLife("reference");
  cacheTag("categories");

  const { data } = await publicClient()
    .from("categories")
    .select("id, name, slug, icon")
    .eq("slug", slug)
    .single();
  return data as {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

export async function getCategoryListingsCached(
  categoryId: string,
  opts: { promoted?: boolean; limit?: number } = {},
): Promise<ListingCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("listings");

  let q = publicClient()
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("category_id", categoryId);
  if (opts.promoted) q = q.eq("is_promoted", true);
  q = q.order("created_at", { ascending: false }).limit(opts.limit ?? 12);
  const { data } = await q;
  return (data ?? []) as unknown as ListingCardRow[];
}

export async function getCategoryStatsCached(categoryId: string) {
  "use cache";
  cacheLife("pricing"); // 5 min
  cacheTag("listings");

  const now = new Date();
  const weekAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [totalRes, newThisWeekRes, avgPriceRes] = await Promise.all([
    publicClient()
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("category_id", categoryId),
    publicClient()
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("category_id", categoryId)
      .gte("created_at", weekAgo),
    publicClient()
      .from("listings")
      .select("price")
      .eq("status", "active")
      .eq("category_id", categoryId)
      .not("price", "is", null)
      .limit(500),
  ]);

  const total = totalRes.count ?? 0;
  const newThisWeek = newThisWeekRes.count ?? 0;
  const prices = (avgPriceRes.data ?? []).map((r) => r.price as number);
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;

  return { total, newThisWeek, avgPrice };
}

// ─── Cached dealer shops (revalidate: 60 s) ─────────────────────────────────

/** Public-safe subset — exclude Stripe secrets. */
const SHOP_CARD_SELECT =
  "id, user_id, shop_name, slug, description, logo_url, banner_url, accent_color, plan_status, plan_tier, created_at";

export type ShopCardRow = {
  id: string;
  user_id: string;
  shop_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  accent_color: string | null;
  plan_status: string;
  plan_tier: string;
  created_at: string;
  listing_count: number;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
};

export async function getActiveShopsCached(): Promise<ShopCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("shops", "listings");

  const sb = publicClient();

  // Fetch all active dealer shops
  const { data: shops } = await sb
    .from("dealer_shops")
    .select(SHOP_CARD_SELECT)
    .eq("plan_status", "active")
    .order("created_at", { ascending: false });

  if (!shops || shops.length === 0) return [];

  // Collect user_ids and fetch profiles + listing counts in parallel (2 queries, not N+1)
  const userIds = shops.map((s) => s.user_id);

  const [{ data: profiles }, { data: countRows }] = await Promise.all([
    sb
      .from("profiles")
      .select("id, display_name, avatar_url, verified")
      .in("id", userIds),
    sb.rpc("get_listing_counts_by_user", { p_user_ids: userIds }),
  ]);

  // Build lookup maps
  const profileMap = new Map(
    (profiles ?? []).map(
      (p: {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        verified: boolean;
      }) => [p.id, p],
    ),
  );

  const countMap = new Map<string, number>();
  for (const row of (countRows ?? []) as {
    user_id: string;
    listing_count: number;
  }[]) {
    countMap.set(row.user_id, row.listing_count);
  }

  return shops.map((shop) => ({
    ...shop,
    listing_count: countMap.get(shop.user_id) ?? 0,
    profile: profileMap.get(shop.user_id) ?? null,
  }));
}

export async function getFeaturedShopsCached(
  limit = 4,
): Promise<ShopCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("shops", "listings");

  const allShops = await getActiveShopsCached();
  const tierRank = { business: 0, pro: 1, starter: 2 } as const;
  const rank = (t: string) => tierRank[t as keyof typeof tierRank] ?? 2;
  // Sort by tier (business first), then listing count desc, take top N
  return [...allShops]
    .sort(
      (a, b) =>
        rank(a.plan_tier) - rank(b.plan_tier) ||
        b.listing_count - a.listing_count,
    )
    .slice(0, limit);
}

/**
 * Fetch active shops that have at least one active listing in the given category.
 * Sorted by tier (business → pro → starter), then by listing count desc.
 */
export async function getShopsByCategoryCached(
  categoryId: string,
): Promise<ShopCardRow[]> {
  "use cache";
  cacheLife("listings");
  cacheTag("shops", "listings");

  const sb = publicClient();

  // Get user_ids that have active listings in this category
  const { data: categoryListings, error: listErr } = await sb
    .from("listings")
    .select("user_id")
    .eq("category_id", categoryId)
    .eq("status", "active");

  if (!categoryListings || categoryListings.length === 0) return [];

  const categoryUserIds = [...new Set(categoryListings.map((l) => l.user_id))];

  // Get all active shops, then filter to those with listings in the category
  const allShops = await getActiveShopsCached();
  const filtered = allShops.filter((shop) =>
    categoryUserIds.includes(shop.user_id),
  );

  // Sort by tier then listing count
  const tierRank = { business: 0, pro: 1, starter: 2 } as const;
  const rank = (t: string) => tierRank[t as keyof typeof tierRank] ?? 2;
  return filtered.sort(
    (a, b) =>
      rank(a.plan_tier) - rank(b.plan_tier) ||
      b.listing_count - a.listing_count,
  );
}

// ─── Non-cached helpers (used server-side with auth context) ─────────────────

export async function getCategories() {
  const supabase = await createClient();
  let q = supabase.from("categories").select("*");

  if (FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES) {
    q = q.in("slug", [...SOFT_LAUNCH_CATEGORY_SLUGS]);
  }

  const { data, error } = await q.order("sort_order");
  if (error) throw error;
  return data;
}

export async function getLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getFeaturedListings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(display_name, avatar_url, verified, rating, total_reviews)
    `,
    )
    .eq("status", "active")
    .eq("is_promoted", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data;
}

export async function getRecentListings(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(display_name, avatar_url, verified, rating, total_reviews)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getListingBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(id, display_name, avatar_url, verified, rating, total_reviews, is_pro_seller, created_at),
      images:listing_images(id, url, thumbnail_url, sort_order)
    `,
    )
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function searchListings({
  query,
  category,
  location,
  sort = "newest",
  limit = 24,
}: {
  query?: string;
  category?: string;
  location?: string;
  sort?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let q = supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(display_name, avatar_url, verified)
    `,
    )
    .eq("status", "active");

  if (query) {
    q = q.textSearch("search_vector", query, {
      type: "websearch",
      config: "english",
    });
  }

  if (category) {
    q = q.eq("category.slug", category);
  }

  if (location) {
    q = q.eq("location.slug", location);
  }

  if (sort === "price_low") q = q.order("price", { ascending: true });
  else if (sort === "price_high") q = q.order("price", { ascending: false });
  else if (sort === "popular") q = q.order("view_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return data;
}

export async function incrementViewCount(listingId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_view_count", { listing_id: listingId });
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { ...user, profile };
}
