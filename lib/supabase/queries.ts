import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
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
// Used inside unstable_cache wrappers so the cache key is stable and we don't
// pull in the cookies() dynamic API (which would bust the cache every request).
function publicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ─── Cached reference data (revalidate: 1 hour) ───────────────────────────────

export const getCategoriesCached = unstable_cache(
  async (): Promise<Category[]> => {
    const { data } = await publicClient()
      .from("categories")
      .select("*")
      .order("sort_order");
    return (data ?? []) as Category[];
  },
  ["categories"],
  { revalidate: 3600, tags: ["categories"] },
);

export const getSubcategoriesCached = unstable_cache(
  async (): Promise<Subcategory[]> => {
    const { data } = await publicClient()
      .from("subcategories")
      .select("id, category_id, name, slug")
      .order("sort_order");
    return (data ?? []) as Subcategory[];
  },
  ["subcategories"],
  { revalidate: 3600, tags: ["subcategories"] },
);

export const getLocationsCached = unstable_cache(
  async (): Promise<Location[]> => {
    const { data } = await publicClient()
      .from("locations")
      .select("id, name, slug")
      .order("sort_order");
    return (data ?? []) as Location[];
  },
  ["locations"],
  { revalidate: 3600, tags: ["locations"] },
);

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

export const getPricingCached = unstable_cache(
  async (): Promise<PricingRow[]> => {
    const { data } = await publicClient()
      .from("pricing")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return (data ?? []) as PricingRow[];
  },
  ["pricing"],
  { revalidate: 300, tags: ["pricing"] },
);

/** Convenience: returns a map keyed by pricing.key (e.g. "featured", "urgent", "dealer_pro") */
export async function getPricingMap(): Promise<Record<string, PricingRow>> {
  const rows = await getPricingCached();
  return Object.fromEntries(rows.map((r) => [r.key, r]));
}

// ─── Cached home-page listing data (revalidate: 60 s) ────────────────────────

export const getFeaturedListingsCached = unstable_cache(
  async (): Promise<ListingCardRow[]> => {
    const { data } = await publicClient()
      .from("listings")
      .select(CARD_SELECT)
      .eq("status", "active")
      .eq("is_promoted", true)
      .order("created_at", { ascending: false })
      .limit(4);
    return (data ?? []) as unknown as ListingCardRow[];
  },
  ["featured-listings"],
  { revalidate: 60, tags: ["listings"] },
);

export const getRecentListingsCached = unstable_cache(
  async (): Promise<ListingCardRow[]> => {
    const { data } = await publicClient()
      .from("listings")
      .select(CARD_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);
    return (data ?? []) as unknown as ListingCardRow[];
  },
  ["recent-listings"],
  { revalidate: 60, tags: ["listings"] },
);

export const getActiveListingCountCached = unstable_cache(
  async (): Promise<number> => {
    const { count } = await publicClient()
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    return count ?? 0;
  },
  ["listing-count"],
  { revalidate: 300, tags: ["listings"] },
);

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
  expires_at, created_at, updated_at,
  categories(name, slug, icon),
  subcategories(name, slug),
  locations(name, slug),
  profiles!listings_user_id_fkey(id, display_name, avatar_url, verified, rating, total_reviews, is_pro_seller, created_at, whatsapp_number, telegram_username),
  listing_images(id, url, thumbnail_url, sort_order)
`;

export const getListingBySlugCached = unstable_cache(
  async (slug: string): Promise<ListingDetailRow | null> => {
    const { data } = await publicClient()
      .from("listings")
      .select(LISTING_DETAIL_SELECT)
      .eq("slug", slug)
      .single();
    return (data ?? null) as ListingDetailRow | null;
  },
  ["listing-by-slug"],
  { revalidate: 60, tags: ["listings"] },
);

export const getRelatedListingsCached = unstable_cache(
  async (categoryId: string, excludeId: string): Promise<ListingCardRow[]> => {
    const { data } = await publicClient()
      .from("listings")
      .select(CARD_SELECT)
      .eq("status", "active")
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(4);
    return (data ?? []) as unknown as ListingCardRow[];
  },
  ["related-listings"],
  { revalidate: 60, tags: ["listings"] },
);

// ─── Category landing page helpers (revalidate: 60 s) ────────────────────────

export const getCategoryBySlugCached = unstable_cache(
  async (slug: string) => {
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
  },
  ["category-by-slug"],
  { revalidate: 3600, tags: ["categories"] },
);

export const getCategoryListingsCached = unstable_cache(
  async (
    categoryId: string,
    opts: { promoted?: boolean; limit?: number } = {},
  ): Promise<ListingCardRow[]> => {
    let q = publicClient()
      .from("listings")
      .select(CARD_SELECT)
      .eq("status", "active")
      .eq("category_id", categoryId);
    if (opts.promoted) q = q.eq("is_promoted", true);
    q = q.order("created_at", { ascending: false }).limit(opts.limit ?? 12);
    const { data } = await q;
    return (data ?? []) as unknown as ListingCardRow[];
  },
  ["category-listings"],
  { revalidate: 60, tags: ["listings"] },
);

export const getCategoryStatsCached = unstable_cache(
  async (categoryId: string) => {
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
  },
  ["category-stats"],
  { revalidate: 300, tags: ["listings"] },
);

// ─── Cached dealer shops (revalidate: 60 s) ─────────────────────────────────

/** Public-safe subset — exclude Stripe secrets. */
const SHOP_CARD_SELECT =
  "id, user_id, shop_name, slug, description, logo_url, banner_url, accent_color, plan_status, created_at";

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
  created_at: string;
  listing_count: number;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
};

export const getActiveShopsCached = unstable_cache(
  async (): Promise<ShopCardRow[]> => {
    const sb = publicClient();

    // Fetch all active dealer shops
    const { data: shops } = await sb
      .from("dealer_shops")
      .select(SHOP_CARD_SELECT)
      .eq("plan_status", "active")
      .order("created_at", { ascending: false });

    if (!shops || shops.length === 0) return [];

    // Collect user_ids and fetch profiles + listing counts in parallel
    const userIds = shops.map((s) => s.user_id);

    // Fetch profiles and per-user listing counts concurrently
    const [{ data: profiles }, ...countResults] = await Promise.all([
      sb
        .from("profiles")
        .select("id, display_name, avatar_url, verified")
        .in("id", userIds),
      ...userIds.map((uid) =>
        sb
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("status", "active")
          .then((res) => ({ user_id: uid, count: res.count ?? 0 })),
      ),
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
    for (const { user_id, count } of countResults) {
      countMap.set(user_id, count);
    }

    return shops.map((shop) => ({
      ...shop,
      listing_count: countMap.get(shop.user_id) ?? 0,
      profile: profileMap.get(shop.user_id) ?? null,
    }));
  },
  ["active-shops"],
  { revalidate: 60, tags: ["shops", "listings"] },
);

export const getFeaturedShopsCached = unstable_cache(
  async (limit = 4): Promise<ShopCardRow[]> => {
    const allShops = await getActiveShopsCached();
    // Sort by listing count desc, take top N
    return [...allShops]
      .sort((a, b) => b.listing_count - a.listing_count)
      .slice(0, limit);
  },
  ["featured-shops"],
  { revalidate: 60, tags: ["shops", "listings"] },
);

// ─── Non-cached helpers (used server-side with auth context) ─────────────────

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
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
