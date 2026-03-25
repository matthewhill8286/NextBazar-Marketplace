/**
 * useCurrentUser — returns the current authenticated user ID from AuthProvider.
 *
 * This is a thin wrapper around `useAuth()` for backward compatibility.
 * New code should prefer `useAuth()` directly from `@/lib/auth-context`.
 */

"use client";

import { useAuth } from "@/lib/auth-context";

type CurrentUserState = {
  userId: string | null;
  loading: boolean;
};

export function useCurrentUser(): CurrentUserState {
  return useAuth();
}
