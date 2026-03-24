/**
 * useCurrentUser — resolves the authenticated Supabase user once on mount.
 *
 * Replaces the copy-pasted pattern:
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) { ... return; }
 *
 * @example
 *   const { userId, loading } = useCurrentUser();
 *   if (loading) return <LoadingSpinner />;
 *   if (!userId) { router.push("/auth/login"); return null; }
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CurrentUserState = {
  userId: string | null;
  loading: boolean;
};

export function useCurrentUser(): CurrentUserState {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setLoading(false);
    });
  }, []);

  return { userId, loading };
}
