import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./profile-client";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, bio, verified, is_pro_seller, created_at, rating, total_reviews",
    )
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  // Fetch active listings
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id, slug, title, price, currency, primary_image_url,
      is_promoted, is_urgent, condition, view_count, created_at, status,
      categories(name, slug, icon),
      locations(name, slug)
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  // Fetch reviews (latest 20)
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id, rating, comment, created_at,
      reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url)
    `)
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Aggregate stats from user_review_stats view
  const { data: stats } = await supabase
    .from("user_review_stats")
    .select("review_count, avg_rating")
    .eq("user_id", userId)
    .maybeSingle();

  // Supabase returns join columns as arrays; unwrap to match SearchListing type
  const normalisedListings = (listings || []).map((l) => ({
    ...l,
    categories: Array.isArray(l.categories)
      ? (l.categories[0] ?? null)
      : l.categories,
    locations: Array.isArray(l.locations)
      ? (l.locations[0] ?? null)
      : l.locations,
  }));

  return (
    <ProfileClient
      profile={profile}
      listings={normalisedListings}
      reviews={(reviews as any) || []}
      reviewCount={Number(stats?.review_count ?? profile.total_reviews ?? 0)}
      avgRating={Number(stats?.avg_rating ?? profile.rating ?? 0)}
    />
  );
}
