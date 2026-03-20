"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/app/components/listing-card";

type Category = { id: string; name: string; slug: string; icon: string };
type Subcategory = { id: string; category_id: string; name: string; slug: string };
type Location = { id: string; name: string; slug: string };

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Seed all filter state from URL params so deep links and refreshes work
  const initialQuery       = searchParams.get("q")           || "";
  const initialCategory    = searchParams.get("category")    || "";
  const initialSubcategory = searchParams.get("subcategory") || "";
  const initialLocation    = searchParams.get("location")    || "";
  const initialSort        = searchParams.get("sort")        || "newest";
  const initialPriceMin    = searchParams.get("priceMin")    || "";
  const initialPriceMax    = searchParams.get("priceMax")    || "";

  const supabase = createClient();

  const [query, setQuery]               = useState(initialQuery);
  const [categorySlug, setCategorySlug]     = useState(initialCategory);
  const [subcategorySlug, setSubcategorySlug] = useState(initialSubcategory);
  const [locationSlug, setLocationSlug]     = useState(initialLocation);
  const [sortBy, setSortBy]             = useState(initialSort);
  const [priceMin, setPriceMin]         = useState(initialPriceMin);
  const [priceMax, setPriceMax]         = useState(initialPriceMax);
  const [showFilters, setShowFilters]   = useState(false);
  const [listings, setListings]         = useState<any[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [locations, setLocations]       = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHits, setTotalHits] = useState(0);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Keep the URL in sync with filter state so every combination is deep-linkable
  // and the browser back/forward buttons work as expected.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query)                         params.set("q",           query);
    if (categorySlug)                  params.set("category",    categorySlug);
    if (subcategorySlug)               params.set("subcategory", subcategorySlug);
    if (locationSlug)                  params.set("location",    locationSlug);
    if (sortBy && sortBy !== "newest") params.set("sort",        sortBy);
    if (priceMin)                      params.set("priceMin",    priceMin);
    if (priceMax)                      params.set("priceMax",    priceMax);

    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }, [query, categorySlug, subcategorySlug, locationSlug, sortBy, priceMin, priceMax, router]);

  // Load categories, subcategories, locations, and auth state once
  useEffect(() => {
    async function loadMeta() {
      const [{ data: cats }, { data: subs }, { data: locs }, { data: { user } }] = await Promise.all([
        supabase.from("categories").select("id, name, slug, icon").order("sort_order"),
        supabase.from("subcategories").select("id, category_id, name, slug").order("sort_order"),
        supabase.from("locations").select("id, name, slug").order("sort_order"),
        supabase.auth.getUser(),
      ]);
      if (cats) setCategories(cats);
      if (subs) setSubcategories(subs);
      if (locs) setLocations(locs);
      if (user) {
        setUserId(user.id);
        const { data: favs } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id);
        if (favs) setSavedIds(new Set(favs.map((f: any) => f.listing_id)));
      }
    }
    loadMeta();
  }, []);

  // Normalise a hit regardless of whether it came from the vector path
  // (flat category_name/location_name fields) or the Supabase join path
  // (nested `categories` / `locations` objects).
  function normalise(h: any) {
    return {
      ...h,
      category: h.category_name
        ? { name: h.category_name, slug: h.category_slug, icon: h.category_icon }
        : h.categories ?? h.category ?? null,
      location: h.location_name
        ? { name: h.location_name, slug: h.location_slug }
        : h.locations ?? h.location ?? null,
    };
  }

  const doSearch = useCallback(async (searchQuery = query) => {
    setLoading(true);
    setAiInterpretation("");

    const params = new URLSearchParams();
    if (searchQuery)   params.set("q",           searchQuery);
    if (categorySlug)  params.set("category",    categorySlug);
    if (subcategorySlug) params.set("subcategory", subcategorySlug);
    if (locationSlug)  params.set("location",    locationSlug);
    if (sortBy)        params.set("sort",         sortBy);
    if (priceMin)      params.set("priceMin",     priceMin);
    if (priceMax)      params.set("priceMax",     priceMax);

    const res = await fetch(`/api/search?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const hits = (data.hits || []).map(normalise);
      setListings(hits);
      setTotalHits(data.totalHits ?? hits.length);
    }

    setLoading(false);
  }, [categorySlug, subcategorySlug, locationSlug, sortBy, priceMin, priceMax]);

  // Run on first load (once categories are ready) and whenever filters change.
  // Deliberately excludes `query` — text search only fires on Enter.
  const filterKey = `${categorySlug}|${subcategorySlug}|${locationSlug}|${sortBy}|${priceMin}|${priceMax}`;
  useEffect(() => {
    if (categories.length === 0) return;
    doSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, categories.length]);

  // When the query is cleared, re-run so results refresh without the old term.
  useEffect(() => {
    if (categories.length === 0) return;
    if (query === "") doSearch("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleAiSearch() {
    if (!query.trim()) { doSearch(); return; }
    setAiSearching(true);
    setLoading(true);
    setAiInterpretation("");
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Normalise shape — AI route returns raw Supabase rows
      const hits = (data.listings || []).map(normalise);
      setListings(hits);
      setTotalHits(hits.length);
      setAiInterpretation(data.interpretation || "");
      // Reflect AI-parsed filters in the UI
      if (data.filters?.category_slug) setCategorySlug(data.filters.category_slug);
      if (data.filters?.location_slug) setLocationSlug(data.filters.location_slug);
    } catch {
      doSearch();
    }
    setAiSearching(false);
    setLoading(false);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAiSearch();
    }
  }

  const activeCategory    = categories.find((c) => c.slug === categorySlug);
  const activeSubcategory = subcategories.find((s) => s.slug === subcategorySlug);
  const visibleSubcategories = subcategories.filter(
    (s) => s.category_id === activeCategory?.id,
  );
  const hasFilters = query || categorySlug || subcategorySlug || locationSlug || priceMin || priceMax;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input
            type="text"
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            placeholder="Try: &quot;cheap car in Limassol under 10k&quot; or &quot;new iPhone&quot;"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAiInterpretation(""); }}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              onClick={handleAiSearch}
              disabled={aiSearching || !query.trim()}
              className="p-2 rounded-lg bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="AI Smart Search"
            >
              {aiSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Category
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400"
                value={categorySlug}
                onChange={(e) => { setCategorySlug(e.target.value); setSubcategorySlug(""); }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Location
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400"
                value={locationSlug}
                onChange={(e) => setLocationSlug(e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.slug}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Sort By
              </label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Price Range (€)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-gray-400 text-sm shrink-0">–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Subcategory drill-down — only visible when a category is selected */}
          {visibleSubcategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Subcategory
              </label>
              <div className="flex flex-wrap gap-2">
                {visibleSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubcategorySlug(subcategorySlug === sub.slug ? "" : sub.slug)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      subcategorySlug === sub.slug
                        ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {activeCategory && (
            <button
              onClick={() => { setCategorySlug(""); setSubcategorySlug(""); }}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {activeCategory.icon} {activeCategory.name}
              <X className="w-3 h-3" />
            </button>
          )}
          {activeSubcategory && (
            <button
              onClick={() => setSubcategorySlug("")}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              {activeSubcategory.name}
              <X className="w-3 h-3" />
            </button>
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              &ldquo;{query}&rdquo;
              <X className="w-3 h-3" />
            </button>
          )}
          {(priceMin || priceMax) && (
            <button
              onClick={() => { setPriceMin(""); setPriceMax(""); }}
              className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
            >
              {priceMin && priceMax
                ? `€${priceMin} – €${priceMax}`
                : priceMin
                  ? `From €${priceMin}`
                  : `Up to €${priceMax}`}
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => {
              setQuery("");
              setCategorySlug("");
              setSubcategorySlug("");
              setLocationSlug("");
              setPriceMin("");
              setPriceMax("");
            }}
            className="text-sm text-gray-400 hover:text-gray-600 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* AI interpretation */}
      {aiInterpretation && (
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm px-4 py-2.5 rounded-xl border border-indigo-100 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{aiInterpretation}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{totalHits}</span>{" "}
          listings found
        </p>
        {!showFilters && (
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="popular">Most Popular</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="aspect-4/3 bg-gray-100 animate-pulse" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                <div className="h-5 bg-gray-100 rounded animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} userId={userId} isSaved={savedIds.has(listing.id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No listings found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategorySlug("");
              setLocationSlug("");
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
