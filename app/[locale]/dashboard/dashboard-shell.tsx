"use client";

import type { DashboardListing } from "@/lib/supabase/supabase.types";
import { DashboardProvider } from "./dashboard-context";

/**
 * Thin client wrapper — receives server-fetched data via props and
 * provides it to child pages through DashboardContext.
 *
 * All heavy data fetching now happens in the server layout.tsx,
 * so there is no loading state or useEffect here.
 */
export default function DashboardShell({
  listings,
  isDealer,
  isProSeller,
  children,
}: {
  listings: DashboardListing[];
  isDealer: boolean;
  isProSeller: boolean;
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider value={{ listings, isDealer, isProSeller }}>
      {children}
    </DashboardProvider>
  );
}
