import { redirect } from "react-router";
import ShopOnboardingClient from "@/app/[locale]/shop-onboarding/shop-onboarding-client";
import ShopOnboardingWizard from "@/app/[locale]/shop-onboarding/shop-onboarding-wizard";
import { requireUser } from "../auth.server";
import { withLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { Route } from "./+types/shop-onboarding";

export function meta() {
  return [{ title: "Welcome to Pro Seller — Set Up Your Shop" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUser(request, params.locale!);
  const url = new URL(request.url);
  const stripeSessionId = url.searchParams.get("session_id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: shop }] = await Promise.all([
    supabase.from("profiles").select("onboarding_completed, display_name").eq("id", userId).single(),
    supabase.from("dealer_shops").select("shop_name, slug, plan_status").eq("user_id", userId).single(),
  ]);
  const isActive = shop?.plan_status === "active";
  const hasConfiguredShop = !!shop?.shop_name;
  if (!isActive && !stripeSessionId) {
    throw redirect(withLocale("/pricing", params.locale!));
  }
  if (hasConfiguredShop && isActive) {
    throw redirect(withLocale("/dashboard?upgraded=true", params.locale!));
  }
  return {
    stripeSessionId,
    isActive,
    wizardProps: {
      userId,
      userName: profile?.display_name ?? user?.user_metadata?.full_name ?? "",
      alreadyOnboarded: profile?.onboarding_completed ?? false,
      shopName: shop?.shop_name ?? "My Shop",
      shopSlug: shop?.slug ?? userId.slice(0, 8),
    },
  };
}

export default function ShopOnboardingPage({ loaderData }: Route.ComponentProps) {
  if (!loaderData.isActive && loaderData.stripeSessionId) {
    return <ShopOnboardingClient stripeSessionId={loaderData.stripeSessionId} {...loaderData.wizardProps} />;
  }
  return <ShopOnboardingWizard {...loaderData.wizardProps} />;
}
