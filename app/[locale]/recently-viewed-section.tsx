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
    <section className="py-20 border-t border-[#e8e6e3]">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Your history
          </p>
          <h2
            className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Recently Viewed
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem("recentlyViewed");
            } catch {}
            setRecentlyViewed([]);
          }}
          className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
        >
          Clear history
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentlyViewed.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
