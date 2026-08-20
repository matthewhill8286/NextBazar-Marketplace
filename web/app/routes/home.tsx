import { data } from "react-router";
import RecentlyViewedSection from "@/app/[locale]/recently-viewed-section";
import CategoriesSection from "@/app/[locale]/sections/categories-section";
import FeaturedSection from "@/app/[locale]/sections/featured-section";
import HeroSection from "@/app/[locale]/sections/hero-section";
import RecentSection from "@/app/[locale]/sections/recent-section";
import WhySection from "@/app/[locale]/sections/why-section";
import TrendingSection from "@/app/[locale]/trending-section";
import { documentCacheHeaders } from "@/lib/http-cache";
import {
  getCategoriesCached,
  getFeaturedListingsCached,
  getRecentListingsCached,
  getSubcategoriesCached,
  getTrendingListingsCached,
} from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth/require-auth";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "NextBazar — Buy & Sell Anything in Cyprus" },
    {
      name: "description",
      content:
        "Cyprus's AI-powered marketplace. Buy and sell vehicles, property, electronics, fashion, and more.",
    },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  const [featured, recent, categories, subcategories, trending, userId] =
    await Promise.all([
      getFeaturedListingsCached(),
      getRecentListingsCached(),
      getCategoriesCached(),
      getSubcategoriesCached(),
      getTrendingListingsCached(),
      getUserId(),
    ]);
  return data(
    { featured, recent, categories, subcategories, trending },
    { headers: documentCacheHeaders(userId) },
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { featured, recent, categories, subcategories, trending } = loaderData;
  return (
    <>
      <HeroSection />
      <CategoriesSection categories={categories} subcategories={subcategories} />
      <FeaturedSection listings={featured} />
      <div className="max-w-7xl mx-auto px-6">
        <TrendingSection fallbackTrending={trending} />
        <RecentlyViewedSection />
      </div>
      <RecentSection listings={recent} />
      <WhySection />
    </>
  );
}
