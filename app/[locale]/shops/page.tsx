import type { Metadata } from "next";
import { getActiveShopsCached } from "@/lib/supabase/queries";
import ShopsClient from "./shops-client";

export const metadata: Metadata = {
  title: "Browse Shops | NextBazar",
  description:
    "Discover verified dealer shops on NextBazar — Cyprus's smartest marketplace.",
  openGraph: {
    title: "Browse Shops | NextBazar",
    description:
      "Discover verified dealer shops on NextBazar — Cyprus's smartest marketplace.",
  },
};

export const revalidate = 60;

export default async function ShopsPage() {
  const shops = await getActiveShopsCached();

  return <ShopsClient shops={shops} />;
}
