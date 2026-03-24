import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/server";
import { CARD_SELECT } from "@/lib/supabase/selects";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";
import type { Tables } from "@/lib/supabase/database.types";
import ShopClient from "./shop-client";

export const revalidate = 60;

/** Public-safe subset — exclude Stripe secrets. */
const SHOP_SELECT =
  "id, user_id, shop_name, slug, description, logo_url, banner_url, accent_color, website, facebook, instagram, tiktok, plan_status, plan_started_at, plan_expires_at, created_at, updated_at";

type DealerShop = Omit<
  Tables<"dealer_shops">,
  "stripe_customer_id" | "stripe_subscription_id"
>;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("dealer_shops")
    .select(SHOP_SELECT)
    .eq("slug", slug)
    .single();

  if (!shop) {
    return {
      title: "Shop Not Found — NextBazar",
      description: "This dealer shop could not be found.",
    };
  }

  return {
    title: `${shop.shop_name} | NextBazar`,
    description:
      shop.description ||
      `Browse ${shop.shop_name}'s listings on NextBazar marketplace.`,
    openGraph: {
      title: `${shop.shop_name} | NextBazar`,
      description:
        shop.description ||
        `Browse ${shop.shop_name}'s listings on NextBazar marketplace.`,
      images: shop.banner_url ? [{ url: shop.banner_url }] : [],
    },
  };
}

export default async function ShopPage(props: PageProps) {
  if (!FEATURE_FLAGS.DEALERS) notFound();
  const { slug } = await props.params;
  const supabase = await createClient();

  // Step 1: Fetch the shop by slug
  const { data: shopRaw } = await supabase
    .from("dealer_shops")
    .select(SHOP_SELECT)
    .eq("slug", slug)
    .single();

  const shop = shopRaw as DealerShop | null;

  if (!shop || shop.plan_status !== "active") {
    notFound();
  }

  // Step 2: Fetch listings + profile in parallel (needs user_id from shop)
  const [{ data: listings }, { data: profile }] = await Promise.all([
    supabase
      .from("listings")
      .select(CARD_SELECT)
      .eq("user_id", shop.user_id)
      .eq("status", "active")
      .order("is_promoted", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, verified, is_dealer, created_at")
      .eq("id", shop.user_id)
      .single(),
  ]);

  return (
    <ShopClient
      shop={shop}
      listings={(listings ?? []) as unknown as ListingCardRow[]}
      profile={
        profile
          ? {
              id: profile.id,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              verified: profile.verified,
              is_dealer: profile.is_dealer,
              created_at: profile.created_at,
            }
          : null
      }
    />
  );
}
