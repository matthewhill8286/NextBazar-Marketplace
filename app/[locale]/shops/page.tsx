import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
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

export default async function ShopsPage() {
  if (!FEATURE_FLAGS.DEALERS) notFound();
  const shops = await getActiveShopsCached();

  return <ShopsClient shops={shops} />;
}
