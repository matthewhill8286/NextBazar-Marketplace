import { data } from "react-router";
import ShopsClient from "@/app/[locale]/shops/shops-client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { getActiveShopsCached } from "@/lib/supabase/queries";
import type { Route } from "./+types/shops";

export function meta() {
  return [
    { title: "Browse Shops | NextBazar" },
    { name: "description", content: "Discover verified dealer shops on NextBazar." },
  ];
}

export async function loader() {
  if (!FEATURE_FLAGS.DEALERS) {
    throw new Response("Not Found", { status: 404 });
  }
  const shops = await getActiveShopsCached();
  return data({ shops });
}

export default function ShopsPage({ loaderData }: Route.ComponentProps) {
  return <ShopsClient shops={loaderData.shops} />;
}
