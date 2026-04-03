import { ArrowRight } from "lucide-react";
import { EmptyListingsIllustration } from "@/app/components/illustrations";
import ListingCard from "@/app/components/listing-card";
import { Link } from "@/i18n/navigation";
import { getRecentListingsCached } from "@/lib/supabase/queries";
import { getTranslator } from "@/lib/translations";

export default async function RecentSection({ locale }: { locale: string }) {
  const [recent, t] = await Promise.all([
    getRecentListingsCached(),
    getTranslator(locale, "home"),
  ]);

  return (
    <section
      className="max-w-7xl mx-auto px-6 py-20"
      aria-label="Recently added listings"
    >
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
            {t("recent.badge")}
          </p>
          <h2
            className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {recent.length === 0 ? t("recent.noListings") : t("recent.title")}
          </h2>
        </div>
        {recent.length > 0 && (
          <Link
            href="/search"
            className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#888] hover:text-[#1a1a1a] transition-colors"
          >
            {t("recent.viewAll")}
            <ArrowRight
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>
      {recent.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recent.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white border border-[#e8e6e3]">
          <EmptyListingsIllustration className="w-20 h-20 mx-auto mb-6 text-[#8a8280]" />
          <h3
            className="text-2xl font-light text-[#1a1a1a] mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("recent.emptyTitle")}
          </h3>
          <p className="text-[#888] mb-8 max-w-sm mx-auto text-sm">
            {t("recent.emptyDesc")}
          </p>
          <Link
            href="/post"
            className="inline-flex items-center gap-3 bg-[#8E7A6B] text-white px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#7A6657] transition-colors"
          >
            {t("recent.emptyCta")}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
