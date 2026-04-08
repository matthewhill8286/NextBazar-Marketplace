"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

type UserShopState = {
  /** Whether the current user has an active dealer shop */
  hasShop: boolean;
  /** The shop slug (for linking to the public shop page) */
  shopSlug: string | null;
  /** True while the initial check is in-flight */
  loading: boolean;
};

async function fetchUserShop(
  userId: string,
): Promise<{ slug: string | null } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dealer_shops")
    .select("slug")
    .eq("user_id", userId)
    .eq("plan_status", "active")
    .maybeSingle();
  return data ? { slug: data.slug ?? null } : null;
}

/**
 * Lightweight hook that checks whether the current user owns an active
 * dealer shop. Backed by SWR so the result is shared/deduped across the
 * navbar, dashboard, and any other consumer.
 */
export function useUserShop(): UserShopState {
  const { userId, loading: authLoading } = useAuth();

  const key = userId ? (["user-shop", userId] as const) : null;
  const { data, isLoading } = useSWR(key, ([, id]) => fetchUserShop(id), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });

  return {
    hasShop: !!data,
    shopSlug: data?.slug ?? null,
    loading: authLoading || (!!userId && isLoading),
  };
}
