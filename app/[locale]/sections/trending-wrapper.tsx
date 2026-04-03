import { getTrendingListingsCached } from "@/lib/supabase/queries";
import TrendingSection from "../trending-section";

/** Server component wrapper that fetches trending data then passes it to the client TrendingSection. */
export default async function TrendingWrapper() {
  const trending = await getTrendingListingsCached();
  return <TrendingSection fallbackTrending={trending} />;
}
