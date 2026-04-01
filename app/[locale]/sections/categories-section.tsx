import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import { Link } from "@/i18n/navigation";
import { getCategoriesCached } from "@/lib/supabase/queries";
import { getTranslator } from "@/lib/translations";

const LANDING_PAGES: Record<string, string> = {
  property: "/properties",
  vehicles: "/vehicles",
};

export default async function CategoriesSection({
  locale,
}: {
  locale: string;
}) {
  const [categories, t] = await Promise.all([
    getCategoriesCached(),
    getTranslator(locale, "home"),
  ]);

  return (
    <section
      className="max-w-7xl mx-auto px-6 pt-24 pb-20"
      aria-label="Browse by category"
    >
      <div className="text-center mb-14">
        <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
          {t("categories.badge")}
        </p>
        <h2
          className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("categories.title")}
        </h2>
      </div>
      {/** biome-ignore lint/a11y/useSemanticElements: we want the div because of the link child */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list">
        {categories.map((cat) => {
          const href =
            LANDING_PAGES[cat.slug] ?? `/search?category=${cat.slug}`;
          const cfg = getCategoryConfig(cat.slug);
          return (
            // biome-ignore lint/a11y/useSemanticElements: we need to keep the Link here
            <Link
              key={cat.id}
              href={href}
              role="listitem"
              aria-label={`${cat.name} — ${cat.listing_count} listings`}
              className="group relative bg-white border border-[#e8e6e3] p-6 text-center transition-all duration-500 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-[#ccc]"
            >
              <div
                className={`w-14 h-14 ${cfg.bg} rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-500`}
              >
                <CategoryIcon slug={cat.slug} size={24} />
              </div>
              <div className="text-sm font-medium text-[#1a1a1a] tracking-wide">
                {cat.name}
              </div>
              {cat.listing_count > 0 && (
                <div className="text-[10px] text-[#888] mt-1 tracking-wider">
                  {t("categories.listings", {
                    count: cat.listing_count.toLocaleString(),
                  })}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
