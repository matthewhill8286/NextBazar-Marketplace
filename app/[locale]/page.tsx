import {
  getActiveListingCountCached,
  getCategoriesCached,
  getFeaturedListingsCached,
  getRecentListingsCached,
} from "@/lib/supabase/queries";
import HomeClient from "./home-client";

export default async function Home() {
  const [categories, featured, recent, totalCount] = await Promise.all([
    getCategoriesCached(),
    getFeaturedListingsCached(),
    getRecentListingsCached(),
    getActiveListingCountCached(),
  ]);

  return (
    <HomeClient
      initialCategories={categories}
      initialFeatured={featured}
      initialRecent={recent}
      initialTotalCount={totalCount}
    />
  );
}
