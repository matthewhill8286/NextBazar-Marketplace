import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ShopOnboardingClient from "./shop-onboarding-client";
import ShopOnboardingWizard from "./shop-onboarding-wizard";

export const metadata: Metadata = {
  title: "Welcome to Pro Seller — Set Up Your Shop",
  description:
    "Complete your profile and set up your shop to start selling on NextBazar.",
};

export default function ShopOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  // Push all runtime data access (searchParams, supabase auth) into a
  // Suspense'd child so the page's static shell streams immediately and
  // Next.js doesn't flag the route as blocking.
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <ShopOnboardingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopOnboardingContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const [params, supabase] = await Promise.all([
    searchParams,
    createClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/shop-onboarding");
  }

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
  const hasConfiguredShop = !!shop?.shop_name;

  // If no active plan and no Stripe session to verify, send back to /pricing
  if (!isActive && !stripeSessionId) {
    redirect("/pricing");
  }

  // If the user already has a configured shop (upgrading from free/pro to
  // business), skip onboarding entirely and go to the dashboard.
  if (hasConfiguredShop && isActive) {
    redirect("/dashboard?upgraded=true");
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

function OnboardingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-2/3 bg-[#e8e6e3] dark:bg-[#3a3735] animate-pulse" />
        <div className="h-4 w-full bg-[#e8e6e3] dark:bg-[#3a3735] animate-pulse" />
        <div className="h-4 w-5/6 bg-[#e8e6e3] dark:bg-[#3a3735] animate-pulse" />
        <div className="h-48 bg-white dark:bg-[#252220] border border-[#e8e6e3] dark:border-[#3a3735] animate-pulse" />
      </div>
    </div>
  );
}
