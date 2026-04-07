import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { Toaster } from "sonner";
import Analytics from "@/app/components/analytics";
import CompareBar from "@/app/components/compare-bar";
import CookieBanner from "@/app/components/cookie-banner";
import Footer from "@/app/components/footer";
import JsonLd from "@/app/components/json-ld";
import Navbar from "@/app/components/navbar";
import RealtimeToasts from "@/app/components/realtime-toasts";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { SavedProvider } from "@/lib/saved-context";
import { organizationJsonLd } from "@/lib/seo";
import {
  getCategoriesCached,
  getSearchTrendingCached,
} from "@/lib/supabase/queries";

type Messages = Record<string, unknown>;

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
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

  // Load messages + reference data in parallel
  const [messagesModule, navCategories, navTrending] = await Promise.all([
    import(`../../messages/${locale}.json`),
    getCategoriesCached(),
    getSearchTrendingCached(),
  ]);
  const messages: Messages = messagesModule.default;

  return (
    <Suspense>
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
                  />
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <CompareBar />
                  <RealtimeToasts />
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
          </NextIntlClientProvider>
        </body>
      </html>
    </Suspense>
  );
}
