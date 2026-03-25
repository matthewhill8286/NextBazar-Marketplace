"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  /** Current user ID or null when logged out */
  userId: string | null;
  /** True while the initial auth check is in-flight */
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  loading: true,
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
export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Single initial getUser() call for the entire app
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setLoading(false);
    });

    // React to login / logout / token refresh
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
    <AuthContext.Provider value={{ userId, loading }}>
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
