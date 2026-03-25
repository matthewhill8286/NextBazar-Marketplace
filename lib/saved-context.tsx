"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
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
  const { userId: authUserId, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load favorites whenever auth user changes (login, logout, user switch)
  useEffect(() => {
    if (authLoading) return;

    if (!authUserId) {
      setUserId(null);
      setSavedIds(new Set());
      setLoading(false);
      return;
    }

    setUserId(authUserId);
    setLoading(true);

    supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", authUserId)
      .then(({ data }) => {
        setSavedIds(new Set((data || []).map((r) => r.listing_id as string)));
        setLoading(false);
      });
  }, [authUserId, authLoading]);

  // Keep in sync with other tabs / devices via realtime — INSERT
  useRealtimeTable({
    channelName: `saved-insert-${userId ?? "anon"}`,
    table: "favorites",
    event: "INSERT",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onPayload: ({ new: row }) => {
      setSavedIds((prev) => new Set([...prev, row.listing_id as string]));
    },
    enabled: !!userId,
  });

  // DELETE events carry the removed row in `old` (Supabase default for deletes)
  useRealtimeTable({
    channelName: `saved-delete-${userId ?? "anon"}`,
    table: "favorites",
    event: "DELETE",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onPayload: ({ old: row }) => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.listing_id as string);
        return next;
      });
    },
    enabled: !!userId,
  });

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
        try {
          await supabase.rpc("decrement_favorite_count", { lid: listingId });
        } catch {}
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: userId, listing_id: listingId });
        try {
          await supabase.rpc("increment_favorite_count", { lid: listingId });
        } catch {}
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

  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}

export function useSaved() {
  return useContext(SavedContext);
}
