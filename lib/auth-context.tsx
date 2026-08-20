"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  /** Current user ID or null when logged out */
  userId: string | null;
  /** True while the initial auth check is in-flight */
  loading: boolean;
  /** Incremented when profile data changes (e.g. avatar upload) */
  profileVersion: number;
  /** Call this to tell subscribers (e.g. UserMenu) to re-fetch profile data */
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  loading: true,
  profileVersion: 0,
  refreshProfile: () => {},
});

/**
 * Single source of truth for the current Supabase auth user.
 *
 * Mount once in the root layout — every component that needs the user ID
 * should call `useAuth()` instead of `supabase.auth.getUser()`.
 *
 * This eliminates the N+1 `/auth/v1/user` network requests that previously
 * fired when many components independently called `getUser()` on mount.
 */
export function AuthProvider({
  children,
  initialUserId,
}: {
  children: ReactNode;
  /** Seeded from the root loader so the navbar does not flash empty. */
  initialUserId?: string | null;
}) {
  const seeded = initialUserId !== undefined;
  const [userId, setUserId] = useState<string | null>(initialUserId ?? null);
  const [loading, setLoading] = useState(!seeded);
  const [profileVersion, setProfileVersion] = useState(0);

  const refreshProfile = useCallback(() => {
    setProfileVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    if (!seeded) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUserId(user?.id ?? null);
        setLoading(false);
      });
    }

    // React to log in / logout / token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ userId, loading, profileVersion, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Read the current auth state from the nearest AuthProvider.
 * Drop-in replacement for the old `useCurrentUser()` hook.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
