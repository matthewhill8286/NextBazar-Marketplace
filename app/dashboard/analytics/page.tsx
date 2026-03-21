"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AnalyticsClient from "./analytics-client";

export default function AnalyticsPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, slug, primary_image_url, view_count, favorite_count, status, created_at")
        .eq("user_id", user.id)
        .order("view_count", { ascending: false });

      const ids = (listingData || []).map((l: any) => l.id);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data: analyticsData } = ids.length
        ? await supabase
            .from("listing_analytics")
            .select("listing_id, date, views, favorites, messages")
            .in("listing_id", ids)
            .gte("date", thirtyDaysAgo)
            .order("date", { ascending: true })
        : { data: [] };

      setListings(listingData || []);
      setAnalytics(analyticsData || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <AnalyticsClient listings={listings} analytics={analytics} />;
}
