"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CARD_SELECT } from "@/lib/supabase/constants";
import type { ListingCardRow, Subcategory } from "@/lib/supabase/supabase.types";

// ─── Shop type (mirrors ShopCardRow from queries.ts) ───────────────────────

const SHOP_CARD_SELECT =
  "id, user_id, shop_name, slug, description, logo_url, banner_url, accent_color, plan_status, plan_tier, created_at";

export type ShopCardData = {
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

export type CategoryInfo = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type CategoryPageData = {
  category: CategoryInfo | null;
  subcategories: Subcategory[];
  featuredListings: ListingCardRow[];
  recentListings: ListingCardRow[];
  categoryShops: ShopCardData[];
  loading: boolean;
};

/**
 * Client-side hook that fetches all data for a category landing page.
 * The page shell (hero, tabs) renders instantly; data streams in via state updates.
 */
export function useCategoryData(
  categorySlug: string,
  opts: { featuredLimit?: number; recentLimit?: number } = {},
): CategoryPageData {
  const { featuredLimit = 24, recentLimit = 48 } = opts;

  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [featuredListings, setFeaturedListings] = useState<ListingCardRow[]>([]);
  const [recentListings, setRecentListings] = useState<ListingCardRow[]>([]);
  const [categoryShops, setCategoryShops] = useState<ShopCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchData() {
      // Step 1: Fetch category + subcategories in parallel (small, fast queries)
      const [catRes, subRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, icon")
          .eq("slug", categorySlug)
          .single(),
        supabase
          .from("subcategories")
          .select("id, category_id, name, slug, sort_order")
          .order("sort_order"),
      ]);

      if (cancelled) return;

      const cat = catRes.data as CategoryInfo | null;
      if (!cat) {
        setCategory(null);
        setLoading(false);
        return;
      }

      setCategory(cat);
      const filteredSubs = (subRes.data ?? []).filter(
        (sc: Subcategory) => sc.category_id === cat.id,
      );
      setSubcategories(filteredSubs);

      // Step 2: Fetch listings + shops in parallel (heavier queries)
      const [featuredRes, recentRes, shopUserRes] = await Promise.all([
        supabase
          .from("listings")
          .select(CARD_SELECT)
          .eq("status", "active")
          .eq("category_id", cat.id)
          .eq("is_promoted", true)
          .order("created_at", { ascending: false })
          .limit(featuredLimit),
        supabase
          .from("listings")
          .select(CARD_SELECT)
          .eq("status", "active")
          .eq("category_id", cat.id)
          .order("created_at", { ascending: false })
          .limit(recentLimit),
        // Get user_ids that have active listings in this category
        supabase
          .from("listings")
          .select("user_id")
          .eq("category_id", cat.id)
          .eq("status", "active"),
      ]);

      if (cancelled) return;

      setFeaturedListings(
        (featuredRes.data ?? []) as unknown as ListingCardRow[],
      );
      setRecentListings(
        (recentRes.data ?? []) as unknown as ListingCardRow[],
      );

      // Step 3: Fetch shops that have listings in this category
      const categoryUserIds = [
        ...new Set(
          (shopUserRes.data ?? []).map((l: { user_id: string }) => l.user_id),
        ),
      ];

      if (categoryUserIds.length > 0) {
        const { data: shops } = await supabase
          .from("dealer_shops")
          .select(SHOP_CARD_SELECT)
          .eq("plan_status", "active")
          .in("user_id", categoryUserIds)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (shops && shops.length > 0) {
          const shopUserIds = shops.map((s: any) => s.user_id);

          // Fetch profiles + listing counts in parallel
          const [{ data: profiles }, ...countResults] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, display_name, avatar_url, verified")
              .in("id", shopUserIds),
            ...shopUserIds.map((uid: string) =>
              supabase
                .from("listings")
                .select("id", { count: "exact", head: true })
                .eq("user_id", uid)
                .eq("status", "active"),
            ),
          ]);

          if (cancelled) return;

          const profileMap = new Map(
            (profiles ?? []).map((p: any) => [p.id, p]),
          );

          const enriched: ShopCardData[] = shops.map(
            (shop: any, i: number) => ({
              ...shop,
              listing_count: countResults[i]?.count ?? 0,
              profile: profileMap.get(shop.user_id) ?? null,
            }),
          );

          // Sort: business first, then pro, then by listing count
          const tierRank: Record<string, number> = {
            business: 0,
            pro: 1,
            starter: 2,
          };
          enriched.sort((a, b) => {
            const ta = tierRank[a.plan_tier] ?? 2;
            const tb = tierRank[b.plan_tier] ?? 2;
            if (ta !== tb) return ta - tb;
            return b.listing_count - a.listing_count;
          });

          setCategoryShops(enriched);
        }
      }

      if (!cancelled) setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, featuredLimit, recentLimit]);

  return { category, subcategories, featuredListings, recentListings, categoryShops, loading };
}
