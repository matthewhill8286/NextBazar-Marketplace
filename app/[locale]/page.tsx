import type { Metadata } from "next";
import { Suspense } from "react";

import RecentlyViewedSection from "./recently-viewed-section";
import CategoriesSection from "./sections/categories-section";
import FeaturedSection from "./sections/featured-section";
import HeroSection from "./sections/hero-section";
import RecentSection from "./sections/recent-section";
import {
  CategoriesSkeleton,
  FeaturedSkeleton,
  HeroSkeleton,
  RecentSkeleton,
  TrendingSkeleton,
  WhySkeleton,
} from "./sections/skeletons";
import TrendingWrapper from "./sections/trending-wrapper";
import WhySection from "./sections/why-section";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";

export const metadata: Metadata = {
  title: "NextBazar — Buy & Sell Anything in Cyprus",
  description:
    "Cyprus's AI-powered marketplace. Buy and sell vehicles, property, electronics, fashion, and more with instant messaging and trusted sellers.",
  openGraph: {
    title: "NextBazar — Buy & Sell Anything in Cyprus",
    description:
      "Cyprus's AI-powered marketplace. Buy and sell vehicles, property, electronics, fashion, and more with instant messaging and trusted sellers.",
    url: BASE_URL,
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
    title: "NextBazar — Buy & Sell Anything in Cyprus",
    description:
      "Cyprus's AI-powered marketplace. Buy and sell vehicles, property, electronics, fashion, and more.",
    images: [`${BASE_URL}/og-image.png`],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      en: `${BASE_URL}/en`,
      el: `${BASE_URL}/el`,
      ru: `${BASE_URL}/ru`,
    },
  },
};

// ─── Page component is fully synchronous — zero awaits ──────────────────────
// Locale is resolved via params.then() inside each Suspense boundary.
// The static shell (all skeleton fallbacks) ships instantly.

export default function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        {params.then(({ locale }) => (
          <HeroSection locale={locale} />
        ))}
      </Suspense>

      <Suspense fallback={<CategoriesSkeleton />}>
        {params.then(({ locale }) => (
          <CategoriesSection locale={locale} />
        ))}
      </Suspense>

      <Suspense fallback={<FeaturedSkeleton />}>
        {params.then(({ locale }) => (
          <FeaturedSection locale={locale} />
        ))}
      </Suspense>

      <div className="max-w-7xl mx-auto px-6">
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingWrapper />
        </Suspense>

        <Suspense>
          <RecentlyViewedSection />
        </Suspense>
      </div>

      <Suspense fallback={<RecentSkeleton />}>
        {params.then(({ locale }) => (
          <RecentSection locale={locale} />
        ))}
      </Suspense>

      <Suspense fallback={<WhySkeleton />}>
        {params.then(({ locale }) => (
          <WhySection locale={locale} />
        ))}
      </Suspense>
    </>
  );
}
