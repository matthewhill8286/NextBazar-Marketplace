/**
 * useUserProfile — SWR-backed hook for the current user's profile row.
 *
 * Multiple components (UserMenu, dashboard headers, settings) all need
 * the same `profiles` row. Previously each one fired its own
 * `useEffect → supabase.from('profiles').select()` on mount, which:
 *
 *   1. Caused N parallel network requests on first paint.
 *   2. Re-fired on every remount, with no shared cache.
 *   3. Forced the consuming component to model `loading` state by hand.
 *
 * SWR fixes all three: the request is keyed on the userId, deduped across
 * components, cached for the session, and revalidated in the background
 * on focus / reconnect. Consumers just call `useUserProfile()` and render.
 *
 * Bumping `profileVersion` from `useAuth().refreshProfile()` invalidates
 * the cache after avatar / display-name edits.
 */

"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export type UserProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_pro_seller: boolean;
};

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_pro_seller")
    .eq("id", userId)
    .single();

  if (error) {
    // Row may not exist yet for brand-new signups — treat as "no profile"
    // rather than throwing, so the navbar still renders.
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    id: userId,
    display_name: data?.display_name ?? null,
    avatar_url: data?.avatar_url ?? null,
    is_pro_seller: data?.is_pro_seller ?? false,
  };
}

export function useUserProfile() {
  const { userId, loading: authLoading, profileVersion } = useAuth();

  // Key is null when there is no user — SWR skips the fetch entirely.
  const key = userId
    ? (["user-profile", userId, profileVersion] as const)
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    ([, id]) => fetchProfile(id),
    {
      // Profile data rarely changes mid-session; avoid spamming Supabase.
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    profile: data ?? null,
    loading: authLoading || (!!userId && isLoading),
    error,
    mutate,
  };
}
