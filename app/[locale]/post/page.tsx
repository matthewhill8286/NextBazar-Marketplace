import type { Metadata } from "next";
import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import { getClientPricing } from "@/lib/stripe";
import PostClient from "./post-client";

export const metadata: Metadata = {
  title: "Post a Listing — NextBazar",
  description: "Create a new listing and start selling on NextBazar.",
};

export default async function PostPage() {
  const [pricing, categories, subcategories, locations] = await Promise.all([
    getClientPricing(),
    getCategoriesCached(),
    getSubcategoriesCached(),
    getLocationsCached(),
  ]);

  return (
    <PostClient
      pricing={pricing}
      categories={categories}
      subcategories={subcategories}
      locations={locations}
    />
  );
}
