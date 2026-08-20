import { Store } from "lucide-react";
import JsonLd from "@/app/components/json-ld";
import ShopClient from "@/app/[locale]/shop/[slug]/shop-client";
import { Link } from "@/i18n/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { BASE_URL, breadcrumbJsonLd, localBusinessJsonLd } from "@/lib/seo";
import { getShopBySlugCached, getShopListingsCached } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Route } from "./+types/shop";

export async function loader({ params }: Route.LoaderArgs) {
  if (!FEATURE_FLAGS.DEALERS) throw new Response("Not Found", { status: 404 });
  const slug = params.slug!;
  const shop = await getShopBySlugCached(slug);
  if (!shop) throw new Response("Not Found", { status: 404 });
  const listings = await getShopListingsCached(shop.user_id);
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, verified, is_pro_seller, created_at")
    .eq("id", shop.user_id)
    .single();
  return { shop, listings, profile, slug, locale: params.locale };
}

export function meta({ data }: Route.MetaArgs) {
  const shop = data?.shop;
  if (!shop) return [{ title: "Shop not found" }];
  return [
    { title: `${shop.shop_name} | NextBazar` },
    { name: "description", content: shop.description || shop.shop_name },
  ];
}

export default function ShopPage({ loaderData }: Route.ComponentProps) {
  const { shop, listings, profile, slug, locale } = loaderData;
  if (shop.plan_status === "closed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-5">
            <Store className="w-8 h-8 text-[#8a8280]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">This shop is currently closed</h1>
          <p className="text-[#6b6560] text-sm mb-6">
            <span className="font-medium text-[#666]">{shop.shop_name}</span> is not accepting orders right now.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors">
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }
  if (shop.plan_status !== "active") {
    throw new Response("Not Found", { status: 404 });
  }
  const shopUrl = `${BASE_URL}/${locale}/shop/${slug}`;
  return (
    <>
      <JsonLd data={localBusinessJsonLd({ name: shop.shop_name, description: shop.description || undefined, url: shopUrl, image: shop.banner_url || undefined })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: BASE_URL }, { name: "Shops", url: `${BASE_URL}/${locale}/shops` }, { name: shop.shop_name, url: shopUrl }])} />
      <ShopClient shop={shop as never} listings={listings} profile={profile} />
    </>
  );
}
