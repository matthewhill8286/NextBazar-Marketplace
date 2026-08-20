import { redirect } from "react-router";
import OnboardingWizard from "@/app/[locale]/onboarding/onboarding-wizard";
import { requireUser } from "../auth.server";
import { withLocale } from "@/lib/i18n";
import { getCategoriesCached } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Route } from "./+types/onboarding";

export function meta() {
  return [{ title: "Welcome to NextBazar — Set Up Your Profile" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUser(request, params.locale!);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, display_name, bio, avatar_url, telegram_username, instagram_username, facebook_username, location_id")
    .eq("id", userId)
    .single();
  if (profile?.onboarding_completed) {
    throw redirect(withLocale("/", params.locale!));
  }
  const [categories, { data: locations }] = await Promise.all([
    getCategoriesCached(),
    supabase.from("locations").select("*").order("sort_order"),
  ]);
  return {
    userId,
    userEmail: user?.email ?? "",
    userName: user?.user_metadata?.full_name ?? "",
    existingAvatar: profile?.avatar_url ?? null,
    categories,
    locations: locations ?? [],
  };
}

export default function OnboardingPage({ loaderData }: Route.ComponentProps) {
  return (
    <OnboardingWizard
      userId={loaderData.userId}
      userEmail={loaderData.userEmail}
      userName={loaderData.userName}
      existingAvatar={loaderData.existingAvatar}
      categories={loaderData.categories}
      locations={loaderData.locations}
    />
  );
}
