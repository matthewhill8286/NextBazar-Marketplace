"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

import ListingCard from "@/app/components/listing-card";
import { createClient } from "@/lib/supabase/client";
import { CARD_SELECT } from "@/lib/supabase/selects";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

export default function RecentlyViewedSection() {
  const supabase = createClient();
  const [recentlyViewed, setRecentlyViewed] = useState<ListingCardRow[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem("recentlyViewed");
        if (!stored) return;

        const ids: string[] = JSON.parse(stored);
        if (ids.length === 0) return;

        const { data: rvData } = await supabase
          .from("listings")
          .select(CARD_SELECT)
          .in("id", ids.slice(0, 8));

        if (rvData && rvData.length > 0) {
          const idOrder = ids.slice(0, 8);
          const sorted = idOrder
            .map((id) => rvData.find((l) => l.id === id))
            .filter((l) => l != null) as unknown as ListingCardRow[];
          setRecentlyViewed(sorted);
        }
      } catch {
        // Silently ignore — user just won't see recently viewed
      }
    }
    load();
  }, [supabase]);

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-linear-to-b from-violet-500 to-purple-600 rounded-full" />
          <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
          <span className="flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            History
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("recentlyViewed");
            } catch {}
            setRecentlyViewed([]);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear history
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentlyViewed.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
