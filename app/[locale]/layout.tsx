import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { type ReactNode, Suspense } from "react";
import { Toaster } from "sonner";
import Analytics from "@/app/components/analytics";
import CompareBar from "@/app/components/compare-bar";
import CookieBanner from "@/app/components/cookie-banner";
import Footer from "@/app/components/footer";
import JsonLd from "@/app/components/json-ld";
import NavBadges from "@/app/components/nav-badges";
import NavBadgesSSR from "@/app/components/nav-badges-ssr";
import Navbar from "@/app/components/navbar";
import RealtimeToastsGate from "@/app/components/realtime-toasts-gate";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { FEATURE_FLAGS, SOFT_LAUNCH_CATEGORY_SLUGS } from "@/lib/feature-flags";
import { SavedProvider } from "@/lib/saved-context";
import { organizationJsonLd } from "@/lib/seo";
import {
  getCategoriesCached,
  getSearchTrendingCached,
} from "@/lib/supabase/queries";
import { SWRProvider } from "@/lib/swr-provider";

type Messages = Record<string, unknown>;

// Playfair Display is only exposed as a CSS variable / utility class and is
// not currently used anywhere in the component tree. Trimmed from 10 font
// files (5 weights × 2 styles) down to just 400 + 700 normal — saves
// ~300–500 KB of woff2 on first visit. Expand again if/when the font is
// actually applied in templates.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal"],
  display: "swap",
  variable: "--font-playfair",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "NextBazar — Buy & Sell Anything in Cyprus",
    template: "%s | NextBazar",
  },
  description:
    "The smarter marketplace. AI-powered search, instant messaging, and trusted sellers. Buy and sell vehicles, property, electronics, and more.",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [{ rel: "mask-icon", url: "/nextbazar-icon.svg", color: "#8E7A6B" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NextBazar",
  },
  openGraph: {
    siteName: "NextBazar",
    type: "website",
    locale: "en_CY",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "NextBazar — Cyprus Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${BASE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      en: `${BASE_URL}/en`,
      el: `${BASE_URL}/el`,
      ru: `${BASE_URL}/ru`,
      "x-default": `${BASE_URL}/en`,
    },
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Signal to next-intl that the locale is statically determined from the
  // route segment. Without this, `getRequestConfig` falls back to reading
  // `headers()` via `requestLocale`, which counts as a runtime data access
  // under `cacheComponents: true` and triggers the
  // "Runtime data was accessed outside of <Suspense>" error.
  setRequestLocale(locale);

  // Load messages + reference data in parallel
  const [messagesModule, allCategories, navTrending] = await Promise.all([
    import(`../../messages/${locale}.json`),
    getCategoriesCached(),
    getSearchTrendingCached(),
  ]);
  const messages: Messages = messagesModule.default;

  // Defensive soft-launch filter applied OUTSIDE the "use cache" boundary —
  // ensures only allowed categories surface in the navbar / search dropdown
  // even if a cached entry was populated before the flag was flipped.
  const navCategories = FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES
    ? allCategories.filter((c) => SOFT_LAUNCH_CATEGORY_SLUGS.has(c.slug))
    : allCategories;

  return (
    <html lang={locale} className={`h-full antialiased ${playfair.variable}`}>
      <body className="min-h-full flex flex-col bg-[#faf9f7]">
        {/* Skip-to-content link — visible only on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#8E7A6B] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <JsonLd data={organizationJsonLd()} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SWRProvider>
            <AuthProvider>
              <SavedProvider>
                <CompareProvider>
                  <Navbar
                    categories={navCategories.map((c) => ({
                      id: c.id,
                      name: c.name,
                      slug: c.slug,
                      icon: c.icon,
                    }))}
                    trending={navTrending}
                    badgesSlot={
                      <Suspense fallback={<NavBadges />}>
                        <NavBadgesSSR />
                      </Suspense>
                    }
                  />
                  <main id="main-content" className="flex-1">
                    {/*
                      Suspense boundary for per-page runtime data reads
                      (cookies, headers, params, searchParams). Required by
                      `cacheComponents: true` in next.config.js — any dynamic
                      access inside a page must be bounded so the static
                      shell (navbar, footer, html head) can stream first.
                    */}
                    <Suspense fallback={null}>{children}</Suspense>
                  </main>
                  <Footer />
                  <CompareBar />
                  <RealtimeToastsGate />
                  <CookieBanner />
                  <Analytics />
                  <Toaster
                    position="top-right"
                    visibleToasts={4}
                    gap={8}
                    toastOptions={{
                      unstyled: true,
                      classNames: {
                        toast:
                          "flex items-center gap-3 w-[360px] border px-4 py-3 shadow-sm text-sm font-medium",
                        success:
                          "bg-emerald-50 border-emerald-200 text-emerald-800",
                        error: "bg-red-50 border-red-200 text-red-800",
                        info: "bg-[#faf9f7] border-[#e8e6e3] text-[#1a1a1a]",
                        warning: "bg-amber-50 border-amber-200 text-amber-800",
                        default: "bg-white border-[#e8e6e3] text-[#1a1a1a]",
                      },
                    }}
                  />
                </CompareProvider>
              </SavedProvider>
            </AuthProvider>
          </SWRProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
