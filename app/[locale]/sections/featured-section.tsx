import { ArrowRight } from "lucide-react";
import ListingCard from "@/app/components/listing-card";
import { Link } from "@/i18n/navigation";
import { getFeaturedListingsCached } from "@/lib/supabase/queries";
import { getTranslator } from "@/lib/translations";

export default async function FeaturedSection({ locale }: { locale: string }) {
  const [featured, t] = await Promise.all([
    getFeaturedListingsCached(),
    getTranslator(locale, "home"),
  ]);

  if (featured.length === 0) return null;

  return (
    <section className="bg-white" aria-label="Featured listings">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
              {t("featured.badge")}
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("featured.title")}
            </h2>
          </div>
          <Link
            href="/search"
            className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#888] hover:text-[#1a1a1a] transition-colors"
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
