"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import ListingCard from "@/app/components/listing-card";
import { LAST_SEARCH_LOCATION_KEY } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { CARD_SELECT } from "@/lib/supabase/selects";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

type Props = {
  /** Pre-fetched fallback (all-Cyprus trending) from the server */
  fallbackTrending: ListingCardRow[];
};

export default function TrendingSection({ fallbackTrending }: Props) {
  const supabase = createClient();
  const [trending, setTrending] = useState<ListingCardRow[]>(fallbackTrending);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationSlug, setLocationSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocal() {
      try {
        const storedSlug = localStorage.getItem(LAST_SEARCH_LOCATION_KEY);
        if (!storedSlug) return; // keep server-provided fallback

        const { data: loc } = await supabase
          .from("locations")
          .select("id, name, slug")
          .eq("slug", storedSlug)
          .single();
        if (!loc) return;

        const { data: trendData } = await supabase
          .from("listings")
          .select(CARD_SELECT)
          .eq("status", "active")
          .eq("location_id", loc.id)
          .order("view_count", { ascending: false })
          .limit(8);

        if (trendData && trendData.length >= 3) {
          setTrending(trendData as unknown as ListingCardRow[]);
          setLocationName(loc.name);
          setLocationSlug(loc.slug);
        }
        // Otherwise keep the server-provided all-Cyprus fallback
      } catch {
        // Keep fallback on error
      }
    }
    loadLocal();
  }, [supabase]);

  if (trending.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-linear-to-b from-orange-400 to-red-500 rounded-full" />
          <h2 className="text-xl font-bold text-gray-900">
            {locationName ? `Trending in ${locationName}` : "Trending Now"}
          </h2>
          <span className="flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            <Flame className="w-3 h-3" />
            Hot
          </span>
        </div>
        <Link
          href={
            locationSlug
              ? `/search?location=${locationSlug}&sort=popular`
              : "/search?sort=popular"
          }
          className="text-sm text-indigo-600 font-semibold hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trending.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
