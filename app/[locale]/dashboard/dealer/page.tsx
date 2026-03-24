import { notFound, redirect } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/server";
import DealerDashboardClient from "./dealer-client";

export default async function DealerDashboardPage() {
  if (!FEATURE_FLAGS.DEALERS) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Load dealer shop + profile in parallel
  const [{ data: shop }, { data: profile }, { data: listings }] =
    await Promise.all([
      supabase
        .from("dealer_shops")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("display_name, is_dealer")
        .eq("id", user.id)
        .single(),
      supabase
        .from("listings")
        .select(
          "id, title, slug, price, currency, status, view_count, favorite_count, message_count, primary_image_url, created_at, is_promoted",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  return (
    <DealerDashboardClient
      shop={shop}
      profile={profile}
      listings={listings ?? []}
      userId={user.id}
      userEmail={user.email ?? ""}
    />
  );
}
