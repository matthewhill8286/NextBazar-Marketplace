"use client";

import { useEffect, useState } from "react";
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

/**
 * Lightweight hook that checks whether the current user owns an active
 * dealer shop.  Result is cached for the lifetime of the component.
 *
 * Use this in the navbar to decide whether to show shop-specific features.
 */
export function useUserShop(): UserShopState {
  const { userId } = useAuth();
  const [state, setState] = useState<UserShopState>({
    hasShop: false,
    shopSlug: null,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setState({ hasShop: false, shopSlug: null, loading: false });
      return;
    }

    const supabase = createClient();
    supabase
      .from("dealer_shops")
      .select("slug")
      .eq("user_id", userId)
      .eq("plan_status", "active")
      .maybeSingle()
      .then(({ data }) => {
        setState({
          hasShop: !!data,
          shopSlug: data?.slug ?? null,
          loading: false,
        });
      });
  }, [userId]);

  return state;
}
