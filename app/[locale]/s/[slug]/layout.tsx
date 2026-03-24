import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import ShopShell from "./shop-shell";

type Messages = Record<string, unknown>;

/**
 * Standalone dealer shop layout.
 *
 * This replaces the main app's Navbar/Footer with the dealer's own branded
 * header and footer. The middleware rewrites subdomain requests here.
 */
export default async function ShopLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!routing.locales.includes(locale as "en" | "el")) {
    notFound();
  }

  // Load messages for i18n
  const messages: Messages = (await import(`../../../../messages/${locale}.json`))
    .default;

  // Fetch shop branding for the shell
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("dealer_shops")
    .select(
      "id, shop_name, slug, logo_url, banner_url, accent_color, description, website, facebook, instagram, tiktok, plan_status",
    )
    .eq("slug", slug)
    .eq("plan_status", "active")
    .single();

  if (!shop) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ShopShell shop={shop}>{children}</ShopShell>
    </NextIntlClientProvider>
  );
}
