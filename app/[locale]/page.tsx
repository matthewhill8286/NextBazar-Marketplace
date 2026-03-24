import {
  getActiveListingCountCached,
  getCategoriesCached,
  getFeaturedListingsCached,
  getFeaturedShopsCached,
  getRecentListingsCached,
} from "@/lib/supabase/queries";
import HomeClient from "./home-client";

export default async function Home() {
  const [categories, featured, recent, totalCount, featuredShops] =
    await Promise.all([
      getCategoriesCached(),
      getFeaturedListingsCached(),
      getRecentListingsCached(),
      getActiveListingCountCached(),
      getFeaturedShopsCached(4),
    ]);

  return (
    <HomeClient
      initialCategories={categories}
      initialFeatured={featured}
      initialRecent={recent}
      initialTotalCount={totalCount}
      initialFeaturedShops={featuredShops}
    />
  );
}
