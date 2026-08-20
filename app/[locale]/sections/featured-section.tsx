import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import ListingCard from "@/app/components/listing-card";
import { Link } from "@/i18n/navigation";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

export default function FeaturedSection({
  listings,
}: {
  listings: ListingCardRow[];
}) {
  const t = useTranslations("home");
  const featured = listings;

  if (featured.length === 0) return null;

  return (
    <section className="bg-white dark:bg-[#252220]" aria-label="Featured listings">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] dark:text-[#9a9290] mb-4">
              {t("featured.badge")}
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("featured.title")}
            </h2>
          </div>
          <Link
            href="/search"
            className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#888] hover:text-[#1a1a1a] dark:hover:text-white transition-colors"
          >
            {t("featured.viewAll")}
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
