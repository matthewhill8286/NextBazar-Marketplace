"use client";

import { ArrowRight, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { Link } from "@/i18n/navigation";
import { LAST_SEARCH_LOCATION_KEY } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { CARD_SELECT } from "@/lib/supabase/selects";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

type Props = {
  /** Pre-fetched fallback (all-Cyprus trending) from the server */
  fallbackTrending: ListingCardRow[];
};

export default function TrendingSection({ fallbackTrending }: Props) {
  const t = useTranslations("home.trending");
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
    <section className="py-20">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4 flex items-center gap-1.5">
            <Flame className="w-3 h-3" />
            {t("badge")}
          </p>
          <h2
            className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {locationName ? (
              <>
                {t("titleLocation", { location: "" })}
                <em className="italic font-normal">{locationName}</em>
              </>
            ) : (
              t("title")
            )}
          </h2>
        </div>
        <Link
          href={
            locationSlug
              ? `/search?location=${locationSlug}&sort=popular`
              : "/search?sort=popular"
          }
          className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
        >
          {t("viewAll")}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trending.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
