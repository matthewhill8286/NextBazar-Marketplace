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
