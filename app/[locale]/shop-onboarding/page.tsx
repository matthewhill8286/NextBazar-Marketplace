import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShopOnboardingClient from "./shop-onboarding-client";
import ShopOnboardingWizard from "./shop-onboarding-wizard";

export const metadata: Metadata = {
  title: "Welcome to Pro Seller — Set Up Your Shop",
  description:
    "Complete your profile and set up your shop to start selling on NextBazar.",
};

export default async function ShopOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/shop-onboarding");
  }

  const params = await searchParams;
  const stripeSessionId = params.session_id;

  // Fetch profile and shop in parallel
  const [{ data: profile }, { data: shop }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_completed, display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("dealer_shops")
      .select("shop_name, slug, plan_status")
      .eq("user_id", user.id)
      .single(),
  ]);

  const isActive = shop?.plan_status === "active";

  // If no active plan and no Stripe session to verify, send back to /pro-sellers
  if (!isActive && !stripeSessionId) {
    redirect("/pro-sellers");
  }

  const wizardProps = {
    userId: user.id,
    userName: profile?.display_name ?? user.user_metadata?.full_name ?? "",
    alreadyOnboarded: profile?.onboarding_completed ?? false,
    shopName: shop?.shop_name ?? "My Shop",
    shopSlug: shop?.slug ?? user.id.slice(0, 8),
  };

  // If coming from Stripe checkout and plan not yet active, render client
  // wrapper that verifies the session first before showing the wizard.
  if (!isActive && stripeSessionId) {
    return (
      <ShopOnboardingClient
        stripeSessionId={stripeSessionId}
        {...wizardProps}
      />
    );
  }

  // Plan is active — show the wizard directly
  return <ShopOnboardingWizard {...wizardProps} />;
}
