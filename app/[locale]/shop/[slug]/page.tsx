import { Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { Tables } from "@/lib/supabase/database.types";
import { CARD_SELECT } from "@/lib/supabase/selects";
import { createClient } from "@/lib/supabase/server";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import ShopClient from "./shop-client";

export const revalidate = 60;

/** Public-safe subset — exclude Stripe secrets. */
const SHOP_SELECT =
  "id, user_id, shop_name, slug, description, logo_url, banner_url, accent_color, website, facebook, instagram, tiktok, plan_status, plan_started_at, plan_expires_at, created_at, updated_at";

type DealerShop = Omit<
  Tables<"dealer_shops">,
  "stripe_customer_id" | "stripe_subscription_id"
>;

// ── Cached shop fetch (shared by generateMetadata + page component) ──────────
const getShopBySlugCached = unstable_cache(
  async (slug: string) => {
    const sb = createPublicClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await sb
      .from("dealer_shops")
      .select(SHOP_SELECT)
      .eq("slug", slug)
      .single();
    return data as DealerShop | null;
  },
  ["shop-by-slug"],
  { revalidate: 60, tags: ["dealer_shops"] },
);

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const shop = await getShopBySlugCached(slug);

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

  // Reuses the same cache entry as generateMetadata — no duplicate DB call
  const shop = await getShopBySlugCached(slug);

  if (!shop) {
    notFound();
  }

  // Show a friendly "shop closed" page instead of a generic 404
  if (shop.plan_status === "closed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            This shop is currently closed
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            <span className="font-medium text-gray-700">
              {shop.shop_name}
            </span>{" "}
            is not accepting orders right now. The seller may reopen in the
            future.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (shop.plan_status !== "active") {
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
      .select("id, display_name, avatar_url, verified, is_pro_seller, created_at")
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
              is_pro_seller: profile.is_pro_seller,
              created_at: profile.created_at,
            }
          : null
      }
    />
  );
}
