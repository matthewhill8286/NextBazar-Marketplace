import PostClient from "@/app/[locale]/post/post-client";
import { requireUser } from "../auth.server";
import { getClientPricing } from "@/lib/stripe";
import {
  getCategoriesCached,
  getLocationsCached,
  getSubcategoriesCached,
} from "@/lib/supabase/queries";
import type { Route } from "./+types/post";

export function meta() {
  return [{ title: "Post a Listing — NextBazar" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireUser(request, params.locale!);
  const [pricing, categories, subcategories, locations] = await Promise.all([
    getClientPricing(),
    getCategoriesCached(),
    getSubcategoriesCached(),
    getLocationsCached(),
  ]);
  return { pricing, categories, subcategories, locations };
}

export default function PostPage({ loaderData }: Route.ComponentProps) {
  return (
    <PostClient
      pricing={loaderData.pricing}
      categories={loaderData.categories}
      subcategories={loaderData.subcategories}
      locations={loaderData.locations}
    />
  );
}
