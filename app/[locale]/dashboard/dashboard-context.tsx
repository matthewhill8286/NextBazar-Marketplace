"use client";

import { createContext, useContext } from "react";
import type { DashboardListing } from "@/lib/supabase/supabase.types";

type DashboardData = {
  listings: DashboardListing[];
  isDealer: boolean;
  isProSeller: boolean;
};

const DashboardContext = createContext<DashboardData>({
  listings: [],
  isDealer: false,
  isProSeller: false,
});

export const DashboardProvider = DashboardContext.Provider;
export function useDashboardData() {
  return useContext(DashboardContext);
}
