import ProfileClient from "@/app/[locale]/profile/[userId]/profile-client";
import { createClient } from "@/lib/supabase/server";
import type { Route } from "./+types/profile";

export async function loader({ params }: Route.LoaderArgs) {
  const userId = params.userId!;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, verified, is_pro_seller, created_at, rating, total_reviews")
    .eq("id", userId)
    .single();
  if (!profile) throw new Response("Not Found", { status: 404 });
  const [{ data: listings }, { data: reviews }, { data: stats }] = await Promise.all([
    supabase.from("listings").select(`
          id, slug, title, price, currency, primary_image_url,
          is_promoted, is_urgent, condition, view_count, created_at, status,
          categories(name, slug, icon),
          locations(name, slug)
        `).eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(12),
    supabase.from("reviews").select("*").eq("reviewee_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.rpc("get_seller_stats", { p_user_id: userId }).maybeSingle(),
  ]);
  return { profile, listings: listings ?? [], reviews: reviews ?? [], stats };
}

export function meta({ data }: Route.MetaArgs) {
  const name = data?.profile?.display_name || "Seller";
  return [{ title: `${name} | NextBazar` }];
}

export default function ProfilePage({ loaderData }: Route.ComponentProps) {
  const { profile, listings, reviews, stats } = loaderData;
  return (
    <ProfileClient
      profile={profile}
      listings={listings as never}
      reviews={reviews as never}
      reviewCount={Number((stats as unknown as { review_count?: number } | null)?.review_count ?? profile.total_reviews ?? 0)}
      avgRating={Number((stats as unknown as { avg_rating?: number } | null)?.avg_rating ?? profile.rating ?? 0)}
    />
  );
}
