import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategoriesCached } from "@/lib/supabase/queries";
import OnboardingWizard from "./onboarding-wizard";

export const metadata: Metadata = {
  title: "Welcome to NextBazar — Set Up Your Profile",
  description:
    "Complete your profile to start buying and selling on NextBazar.",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/onboarding");
  }

  // Check if already onboarded
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "onboarding_completed, display_name, bio, avatar_url, telegram_username, instagram_username, facebook_username, location_id",
    )
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/");
  }

  // Fetch categories (cached) and full locations (with lat/lng for geo-matching)
  const [categories, { data: locations }] = await Promise.all([
    getCategoriesCached(),
    supabase.from("locations").select("*").order("sort_order"),
  ]);

  return (
    <OnboardingWizard
      userId={user.id}
      userEmail={user.email ?? ""}
      userName={user.user_metadata?.full_name ?? ""}
      existingAvatar={profile?.avatar_url ?? null}
      categories={categories}
      locations={locations ?? []}
    />
  );
}
