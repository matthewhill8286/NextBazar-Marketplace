"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * App-wide SWR defaults.
 *
 * Most of our user-scoped queries (profile, shop, badges) are tolerant of
 * mild staleness and we'd rather not hit Supabase every time a tab regains
 * focus. Individual hooks can still override these per-call.
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        dedupingInterval: 30_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
