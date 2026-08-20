import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import { Link } from "@/i18n/navigation";
import type { Category, Subcategory } from "@/lib/supabase/supabase.types";

const LANDING_PAGES: Record<string, string> = {
  property: "/properties",
  vehicles: "/vehicles",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  vehicles:
    "Find your perfect ride — cars, motorcycles, vans, and commercial vehicles from private sellers and dealers across Cyprus.",
  property:
    "Discover homes, apartments, land, and commercial spaces for sale or rent in every city and village across the island.",
};

export default function CategoriesSection({
  categories,
  subcategories,
}: {
  categories: Category[];
  subcategories: Subcategory[];
}) {
  const t = useTranslations("home");

  return (
    <section
      className="max-w-7xl mx-auto px-6 pt-24 pb-20"
      aria-label="Browse by category"
    >
      <div className="text-center mb-14">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] dark:text-[#9a9290] mb-4">
          {t("categories.badge")}
        </p>
        <h2
          className="text-3xl md:text-4xl font-light text-[#1a1a1a] dark:text-[#e8e6e3]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("categories.title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list">
        {categories.map((cat) => {
          const href =
            LANDING_PAGES[cat.slug] ?? `/search?category=${cat.slug}`;
          const cfg = getCategoryConfig(cat.slug);
          const catSubs = subcategories
            .filter((s) => s.category_id === cat.id)
            .slice(0, 6);
          const description =
            CATEGORY_DESCRIPTIONS[cat.slug] || `Browse ${cat.name} listings`;

          return (
            <Link
              key={cat.id}
              href={href}
              role="listitem"
              aria-label={`${cat.name} — ${cat.listing_count} listings`}
              className="group relative bg-white dark:bg-[#252220] border border-[#e8e6e3] dark:border-[#3a3735] p-8 transition-all duration-500 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-[#ccc] overflow-hidden"
            >
              {/* Icon + heading */}
              <div className="flex items-start gap-5 mb-5">
                <div
                  className={`w-16 h-16 ${cfg.bg} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}
                >
                  <CategoryIcon slug={cat.slug} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                    {cat.name}
                  </h3>
                  {cat.listing_count > 0 && (
                    <p className="text-xs text-[#8a8280] dark:text-[#6b6560]">
                      {cat.listing_count.toLocaleString()}{" "}
                      {t("categories.listings")}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-[#ccc] group-hover:text-[#1a1a1a] dark:group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1" />
              </div>

              {/* Description */}
              <p className="text-sm text-[#6b6560] dark:text-[#9a9290] leading-relaxed mb-5">
                {description}
              </p>

              {/* Subcategory chips */}
              {catSubs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {catSubs.map((sub) => (
                    <span
                      key={sub.id}
                      className="text-[11px] font-medium text-[#666] dark:text-[#9a9290] bg-[#faf9f7] dark:bg-[#1e1c1a] border border-[#e8e6e3] dark:border-[#3a3735] px-3 py-1.5 group-hover:bg-[#f0eeeb] dark:group-hover:bg-[#3a3735] transition-colors"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a1a1a] dark:bg-[#e8e6e3] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
