import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CategoryIcon, { getCategoryConfig } from "./category-icon";

export default async function CategoryGrid() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (!categories || categories.length === 0) return null;

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.slug}`}
          className="bg-white p-3 border border-[#e8e6e3] hover:border-[#e8e6e3] hover:shadow-md transition-all text-center group"
        >
          <div
            className={`w-10 h-10 ${getCategoryConfig(cat.slug).bg} flex items-center justify-center mb-1.5 mx-auto group-hover:scale-110 transition-transform`}
          >
            <CategoryIcon slug={cat.slug} size={20} />
          </div>
          <div className="text-xs font-medium text-[#666]">{cat.name}</div>
          <div className="text-xs text-[#bbb]">
            {(cat.listing_count || 0).toLocaleString()}
          </div>
        </Link>
      ))}
    </div>
  );
}
