"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type SavedContextValue = {
  /** Set of listing IDs the current user has saved */
  savedIds: Set<string>;
  /** Total count (same as savedIds.size, exposed for convenience) */
  count: number;
  /** True while the initial fetch is in flight */
  loading: boolean;
  /** Toggle a listing's saved state — instant optimistic update */
  toggle: (listingId: string) => Promise<void>;
  /** Check whether a specific listing is saved */
  isSaved: (listingId: string) => boolean;
};

const SavedContext = createContext<SavedContextValue>({
  savedIds: new Set(),
  count: 0,
  loading: true,
  toggle: async () => {},
  isSaved: () => false,
});

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user.id);

      setSavedIds(new Set((data || []).map((r) => r.listing_id as string)));
      setLoading(false);
    }
    init();
  }, []);

  // Keep in sync with other tabs / devices via realtime
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("saved-sync")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setSavedIds((prev) => new Set([...prev, payload.new.listing_id as string]));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(payload.old.listing_id as string);
            return next;
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const toggle = useCallback(
    async (listingId: string) => {
      if (!userId) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const alreadySaved = savedIds.has(listingId);

      // Instant optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (alreadySaved) {
          next.delete(listingId);
        } else {
          next.add(listingId);
        }
        return next;
      });

      // Persist
      if (alreadySaved) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);
        try { await supabase.rpc("decrement_favorite_count", { lid: listingId }); } catch {}
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: userId, listing_id: listingId });
        try { await supabase.rpc("increment_favorite_count", { lid: listingId }); } catch {}
      }
    },
    [userId, savedIds, supabase],
  );

  const isSaved = useCallback(
    (listingId: string) => savedIds.has(listingId),
    [savedIds],
  );

  const value = useMemo(
    () => ({ savedIds, count: savedIds.size, loading, toggle, isSaved }),
    [savedIds, loading, toggle, isSaved],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  return useContext(SavedContext);
}
