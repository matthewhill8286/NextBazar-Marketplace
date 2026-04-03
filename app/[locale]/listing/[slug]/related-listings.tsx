import { ArrowRight } from "lucide-react";
import ListingCard from "@/app/components/listing-card";
import { Link } from "@/i18n/navigation";
import { getRelatedListingsCached } from "@/lib/supabase/queries";
import { getTranslator } from "@/lib/translations";

type Props = {
  locale: string;
  categoryId: string;
  excludeId: string;
  categorySlug: string;
};

/** Async server component — fetches and renders related listings independently. */
export default async function RelatedListings({
  locale,
  categoryId,
  excludeId,
  categorySlug,
}: Props) {
  const [related, t] = await Promise.all([
    getRelatedListingsCached(categoryId, excludeId),
    getTranslator(locale, "listing"),
  ]);

  if (related.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
            {t("moreToExplore")}
          </p>
          <h2
            className="text-3xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("similarListings")}
          </h2>
        </div>
        <Link
          href={`/search?category=${categorySlug}`}
          className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
        >
          {t("viewMore")}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((item) => (
          <ListingCard key={item.id} listing={item} />
        ))}
      </div>
    </section>
  );
}
