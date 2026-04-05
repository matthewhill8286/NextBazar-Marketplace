import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { buildAlternates } from "@/lib/seo";
import { getActiveShopsCached } from "@/lib/supabase/queries";
import ShopsLoading from "./loading";
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
  alternates: buildAlternates("/shops"),
};

async function ShopsContent() {
  const shops = await getActiveShopsCached();
  return <ShopsClient shops={shops} />;
}

export default function ShopsPage() {
  if (!FEATURE_FLAGS.DEALERS) notFound();

  return (
    <Suspense fallback={<ShopsLoading />}>
      <ShopsContent />
    </Suspense>
  );
}
