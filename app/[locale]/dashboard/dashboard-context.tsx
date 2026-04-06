"use client";

import { createContext, useContext } from "react";
import type {
  Category,
  DashboardListing,
  Location,
  Subcategory,
} from "@/lib/supabase/supabase.types";

type DashboardData = {
  listings: DashboardListing[];
  isDealer: boolean;
  isProSeller: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  locations: Location[];
};

const DashboardContext = createContext<DashboardData>({
  listings: [],
  isDealer: false,
  isProSeller: false,
  categories: [],
  subcategories: [],
  locations: [],
});

export const DashboardProvider = DashboardContext.Provider;
export function useDashboardData() {
  return useContext(DashboardContext);
}
