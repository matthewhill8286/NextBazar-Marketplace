"use client";

import {
  LayoutGrid,
  Loader2,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapLocation } from "@/app/components/listings-map";

// Leaflet uses browser-only APIs — must be dynamically imported
const ListingsMap = dynamic(() => import("@/app/components/listings-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-gray-100 animate-pulse" style={{ height: 420 }} />
  ),
});
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import ListingCard from "@/app/components/listing-card";
import SaveSearchButton from "@/app/components/save-search-button";
import { LAST_SEARCH_LOCATION_KEY, SEARCH_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  CategoryJoin,
  Location,
  LocationJoin,
  SearchListing,
  Subcategory,
} from "@/lib/supabase/supabase.types";

type Props = {
  initialCategories?: Category[];
  initialSubcategories?: Subcategory[];
  initialLocations?: Location[];
};

export default function SearchClient({
  initialCategories = [],
  initialSubcategories = [],
  initialLocations = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Seed from URL once on mount ─────────────────────────────────────────
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSubcategory = searchParams.get("subcategory") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const initialPriceMin = searchParams.get("priceMin") || "";
  const initialPriceMax = searchParams.get("priceMax") || "";
  const initialAi = searchParams.get("ai") === "1";

  const supabase = createClient();

  // ─── TWO query states ─────────────────────────────────────────────────────
  // inputValue: what the user is currently typing (live, no search triggered)
  // submittedQuery: what was last actually searched (Enter / button press)
  const [inputValue, setInputValue] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [subcategorySlug, setSubcategorySlug] = useState(initialSubcategory);
  const [locationSlug, setLocationSlug] = useState(initialLocation);
  const [sortBy, setSortBy] = useState(initialSort);
  const [priceMin, setPriceMin] = useState(initialPriceMin);
  const [priceMax, setPriceMax] = useState(initialPriceMax);
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState<SearchListing[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [subcategories, setSubcategories] =
    useState<Subcategory[]>(initialSubcategories);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = SEARCH_PAGE_SIZE;

  const [aiSearching, setAiSearching] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [wasAiSearch, setWasAiSearch] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // ─── Featured/promoted listings shown when no search is active ────────────
  const [featuredListings, setFeaturedListings] = useState<SearchListing[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(
    !initialQuery && !initialCategory && !initialLocation,
  );

  // ─── Persist last-used location slug so the home page can show trending ────
  useEffect(() => {
    if (locationSlug) {
      try { localStorage.setItem(LAST_SEARCH_LOCATION_KEY, locationSlug); } catch {}
    }
  }, [locationSlug]);

  // ─── Ref: suppress filterKey re-trigger after AI search sets filters ──────
  // When AI search calls setCategorySlug / setLocationSlug to update the UI,
  // that would normally re-fire the filter effect and wipe the AI results.
  // This ref blocks exactly ONE re-trigger.
  const suppressNextFilterSearch = useRef(false);

  // ─── Ref: track if we've auto-fired AI search from ?ai=1 param ───────────
  const aiAutoFired = useRef(false);

  // ─── Ref: track the last query WE pushed to the URL (to avoid re-searching
  //     when our own syncUrl call triggers the searchParams watcher) ─────────
  const lastInternalQuery = useRef(initialQuery);

  // ─── Load featured/promoted listings once ────────────────────────────────
  useEffect(() => {
    async function loadFeatured() {
      setFeaturedLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("*, categories(name, slug, icon), locations(name, slug)")
        .eq("status", "active")
        .eq("is_promoted", true)
        .order("is_promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24);
      if (data) setFeaturedListings(data.map(normalise));
      setFeaturedLoading(false);
    }
    loadFeatured();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase.from]);

  // ─── Load location listing counts for the map ─────────────────────────────
  // Re-runs whenever the map is visible OR any active filter changes so that
  // the pin counts always reflect exactly what the grid is showing.
  useEffect(() => {
    if (viewMode !== "map") return;
    setMapLoading(true);
    async function loadMap() {
      // Fetch all locations that have coordinates
      const { data: locs } = await supabase
        .from("locations")
        .select("id, name, slug, lat, lng")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (!locs || locs.length === 0) return;

      // Build a filtered count query that mirrors the grid filters
      let query = supabase
        .from("listings")
        .select("location_id")
        .eq("status", "active")
        .not("location_id", "is", null);

      // Category filter — look up the id from the slug in local state
      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq("category_id", cat.id);
      }

      // Subcategory filter
      if (subcategorySlug) {
        const sub = subcategories.find((s) => s.slug === subcategorySlug);
        if (sub) query = query.eq("subcategory_id", sub.id);
      }

      // Price range
      if (priceMin) query = query.gte("price", Number(priceMin));
      if (priceMax) query = query.lte("price", Number(priceMax));

      // Text search — ilike on title gives a close approximation of grid results
      if (submittedQuery.trim()) {
        query = query.ilike("title", `%${submittedQuery.trim()}%`);
      }

      const { data: counts } = await query;

      const countMap: Record<string, number> = {};
      for (const row of counts ?? []) {
        if (row.location_id)
          countMap[row.location_id] = (countMap[row.location_id] ?? 0) + 1;
      }

      const pins: MapLocation[] = locs
        .filter((l) => (countMap[l.id] ?? 0) > 0)
        .map((l) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          lat: l.lat as number,
          lng: l.lng as number,
          count: countMap[l.id] ?? 0,
        }));

      setMapLocations(pins);
      setMapLoading(false);
    }
    loadMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, submittedQuery, categorySlug, subcategorySlug, priceMin, priceMax, categories, subcategories, supabase.from]);

  // ─── Load auth once (categories/locations already hydrated from server) ─────
  useEffect(() => {
    async function loadAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Auth state is managed by SavedProvider in the layout —
      // nothing more to do here; categories/locs came in as props.
      void user;
    }
    loadAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase.auth.getUser]);

  // ─── Normalise hit shape ──────────────────────────────────────────────────
  // Accepts both full Supabase rows (categories/locations objects) and flat
  // vector-search RPC results (category_name / location_name columns).
  function normalise(h: Record<string, unknown>): SearchListing {
    return {
      ...(h as SearchListing),
      category: h.category_name
        ? {
            name: h.category_name as string,
            slug: h.category_slug as string,
            icon: h.category_icon as string | null,
          }
        : ((h.categories ?? h.category ?? null) as CategoryJoin | null),
      location: h.location_name
        ? { name: h.location_name as string, slug: h.location_slug as string }
        : ((h.locations ?? h.location ?? null) as LocationJoin | null),
    };
  }

  // ─── Build API params ─────────────────────────────────────────────────────
  const buildParams = useCallback(
    (q: string, pageOffset: number) => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (categorySlug) p.set("category", categorySlug);
      if (subcategorySlug) p.set("subcategory", subcategorySlug);
      if (locationSlug) p.set("location", locationSlug);
      if (sortBy) p.set("sort", sortBy);
      if (priceMin) p.set("priceMin", priceMin);
      if (priceMax) p.set("priceMax", priceMax);
      p.set("limit", String(PAGE_SIZE));
      p.set("offset", String(pageOffset));
      return p;
    },
    [categorySlug, subcategorySlug, locationSlug, sortBy, priceMin, priceMax, PAGE_SIZE],
  );

  // ─── Core search ──────────────────────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies:
  const doSearch = useCallback(
    async (q: string) => {
      setLoading(true);
      setAiInterpretation("");
      setWasAiSearch(false);
      setOffset(0);
      const res = await fetch(`/api/search?${buildParams(q, 0)}`);
      if (res.ok) {
        const data = await res.json();
        const hits = (data.hits || []).map(normalise);
        setListings(hits);
        setTotalHits(data.totalHits ?? hits.length);
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildParams],
  );

  // ─── Filter-change effect (NOT fired by text input) ───────────────────────
  const filterKey = `${categorySlug}|${subcategorySlug}|${locationSlug}|${sortBy}|${priceMin}|${priceMax}`;
  useEffect(() => {
    if (categories.length === 0) return;

    // Auto-fire AI search when arriving from the global search bar with ?ai=1
    if (initialAi && !aiAutoFired.current) {
      aiAutoFired.current = true;
      suppressNextFilterSearch.current = true;
      handleAiSearch(initialQuery);
      return;
    }

    // Block the one extra trigger caused by AI search updating filter state
    if (suppressNextFilterSearch.current) {
      suppressNextFilterSearch.current = false;
      return;
    }

    doSearch(submittedQuery);
    syncUrl(submittedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, categories.length]);

  // ─── Sync URL only when a search is actually executed ─────────────────────
  function syncUrl(q: string) {
    lastInternalQuery.current = q; // mark as our own change so the watcher ignores it
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categorySlug) params.set("category", categorySlug);
    if (subcategorySlug) params.set("subcategory", subcategorySlug);
    if (locationSlug) params.set("location", locationSlug);
    if (sortBy && sortBy !== "newest") params.set("sort", sortBy);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }

  // ─── React to URL changes driven by the global header search bar ─────────
  // When the header fires router.replace("/search?q=..."), searchParams updates
  // here. We only act if the new q differs from what we last pushed ourselves.
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (urlQ === lastInternalQuery.current) return; // our own syncUrl — ignore
    lastInternalQuery.current = urlQ;
    setInputValue(urlQ);
    setSubmittedQuery(urlQ);
    if (categories.length > 0) {
      doSearch(urlQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── Load more ────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const next = offset + PAGE_SIZE;
    const res = await fetch(`/api/search?${buildParams(submittedQuery, next)}`);
    if (res.ok) {
      const data = await res.json();
      const hits = (data.hits || []).map(normalise);
      setListings((prev) => [...prev, ...hits]);
      setTotalHits(data.totalHits ?? listings.length + hits.length);
      setOffset(next);
    }
    setLoadingMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, submittedQuery, buildParams, listings.length]);

  // ─── Execute regular search (Enter / button) ──────────────────────────────
  function executeSearch(q = inputValue) {
    setSubmittedQuery(q);
    syncUrl(q);
    doSearch(q);
  }

  // ─── AI search ────────────────────────────────────────────────────────────
  async function handleAiSearch(q = inputValue) {
    if (!q.trim()) {
      executeSearch("");
      return;
    }
    setAiSearching(true);
    setLoading(true);
    setAiInterpretation("");
    setSubmittedQuery(q);
    syncUrl(q);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) new Error();
      const data = await res.json();
      const hits = (data.listings || []).map(normalise);
      setListings(hits);
      setTotalHits(hits.length);
      setAiInterpretation(data.interpretation || "");
      setWasAiSearch(true);

      // Update filter chips — but suppress the doSearch re-trigger this causes
      if (data.filters?.category_slug || data.filters?.location_slug) {
        suppressNextFilterSearch.current = true;
      }
      if (data.filters?.category_slug)
        setCategorySlug(data.filters.category_slug);
      if (data.filters?.location_slug)
        setLocationSlug(data.filters.location_slug);
    } catch {
      // AI failed — fall back to regular search
      doSearch(q);
    }
    setAiSearching(false);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch();
    }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const activeSubcategory = subcategories.find(
    (s) => s.slug === subcategorySlug,
  );
  const activeLocation = locations.find((l) => l.slug === locationSlug);
  const visibleSubcategories = subcategories.filter(
    (s) => s.category_id === activeCategory?.id,
  );
  const hasFilters =
    submittedQuery ||
    categorySlug ||
    subcategorySlug ||
    locationSlug ||
    priceMin ||
    priceMax;
  const noResults =
    !loading && listings.length === 0 && (hasFilters || submittedQuery);

  return (
    <>
      {/* ── Hero search header ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white py-8 px-4">
        {/* Dot mesh */}
        <div
          className="absolute inset-0 opacity-[0.10] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Ambient blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-violet-500 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          {/* Dynamic title + count */}
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {submittedQuery ? (
                <>
                  Results for{" "}
                  <span className="text-amber-300">
                    &ldquo;{submittedQuery}&rdquo;
                  </span>
                </>
              ) : activeCategory ? (
                <>
                  <span className="text-indigo-200">Browse</span>{" "}
                  {activeCategory.name}
                </>
              ) : (
                "Browse Listings"
              )}
            </h1>
            <p className="text-indigo-200 text-sm mt-1.5">
              {loading ? (
                "Finding listings…"
              ) : totalHits > 0 ? (
                <>
                  <span className="text-white font-semibold">
                    {totalHits.toLocaleString()}
                  </span>{" "}
                  {totalHits === 1 ? "listing" : "listings"} available
                </>
              ) : hasFilters ? (
                "No listings match your search"
              ) : (
                "Discover great deals across Cyprus"
              )}
            </p>
          </div>

          {/* Search input */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-white/50 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-12 pr-28 py-4 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm text-white placeholder-white/50 focus:bg-white/20 focus:outline-none focus:border-white/50 text-sm"
              placeholder="Search listings… or press Enter to search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {inputValue && (
                <button
                  onClick={() => {
                    setInputValue("");
                    executeSearch("");
                  }}
                  className="p-2 rounded-xl text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleAiSearch()}
                disabled={aiSearching || !inputValue.trim()}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                className={`p-2 rounded-xl transition-colors ${showFilters ? "bg-white/30 text-white" : "bg-white/20 hover:bg-white/30 text-white"}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hint row */}
          <p className="text-center text-xs text-white/45 mt-2.5">
            Press{" "}
            <kbd className="bg-white/15 border border-white/20 px-1.5 py-0.5 rounded text-white/60 font-mono text-[11px]">
              Enter
            </kbd>{" "}
            to search · <Sparkles className="w-3 h-3 inline text-indigo-300" />{" "}
            for AI smart search
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Filters Panel ───────────────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400"
                  value={categorySlug}
                  onChange={(e) => {
                    setCategorySlug(e.target.value);
                    setSubcategorySlug("");
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Location
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400"
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
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400"
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

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Price Range (€)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    €
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <span className="text-gray-400 text-sm shrink-0">–</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    €
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {visibleSubcategories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Subcategory
                </label>
                <div className="flex flex-wrap gap-2">
                  {visibleSubcategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() =>
                        setSubcategorySlug(
                          subcategorySlug === sub.slug ? "" : sub.slug,
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        subcategorySlug === sub.slug
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
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

        {/* ── Active filter chips ──────────────────────────────────────────── */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {activeCategory && (
              <button
                onClick={() => {
                  setCategorySlug("");
                  setSubcategorySlug("");
                }}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <span
                  className={`w-4 h-4 ${getCategoryConfig(activeCategory.slug).bg} rounded flex items-center justify-center`}
                >
                  <CategoryIcon slug={activeCategory.slug} size={10} />
                </span>
                {activeCategory.name}
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
            {activeLocation && (
              <button
                onClick={() => setLocationSlug("")}
                className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-sky-100 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {activeLocation.name}
                <X className="w-3 h-3" />
              </button>
            )}
            {submittedQuery && (
              <button
                onClick={() => {
                  setInputValue("");
                  executeSearch("");
                }}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                &ldquo;{submittedQuery}&rdquo;
                <X className="w-3 h-3" />
              </button>
            )}
            {(priceMin || priceMax) && (
              <button
                onClick={() => {
                  setPriceMin("");
                  setPriceMax("");
                }}
                className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
              >
                {priceMin && priceMax
                  ? `€${priceMin}–€${priceMax}`
                  : priceMin
                    ? `From €${priceMin}`
                    : `Up to €${priceMax}`}
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => {
                setInputValue("");
                setSubmittedQuery("");
                setCategorySlug("");
                setSubcategorySlug("");
                setLocationSlug("");
                setPriceMin("");
                setPriceMax("");
                setListings([]);
                setTotalHits(0);
                setAiInterpretation("");
                setWasAiSearch(false);
                lastInternalQuery.current = "";
                router.replace("/search", { scroll: false });
              }}
              className="text-sm text-gray-400 hover:text-gray-600 ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── AI interpretation banner ─────────────────────────────────────── */}
        {aiInterpretation && (
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm px-4 py-2.5 rounded-xl border border-indigo-100 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{aiInterpretation}</span>
          </div>
        )}

        {/* ── Results header ───────────────────────────────────────────────── */}
        {!noResults && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!loading && (
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">
                    {totalHits}
                  </span>{" "}
                  {totalHits === 1 ? "listing" : "listings"} found
                  {listings.length < totalHits && (
                    <span className="text-gray-400">
                      {" "}
                      · showing {listings.length}
                    </span>
                  )}
                </p>
              )}
              <SaveSearchButton
                query={submittedQuery}
                categorySlug={categorySlug}
                subcategorySlug={subcategorySlug}
                locationSlug={locationSlug}
                priceMin={priceMin}
                priceMax={priceMax}
                sortBy={sortBy}
              />
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "map" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
                  title="Map view"
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
              {!showFilters && (
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 bg-white"
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
          </div>
        )}

        {/* ── Map view ──────────────────────────────────────────────────────── */}
        {viewMode === "map" && (
          <div className="mb-6">
            {mapLoading ? (
              <div
                className="w-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center"
                style={{ height: 420 }}
              >
                <p className="text-sm text-gray-400">Updating map…</p>
              </div>
            ) : (
              <>
                <ListingsMap
                  locations={mapLocations}
                  selectedSlug={locationSlug}
                  onSelectLocation={(slug) => {
                    setLocationSlug(slug === locationSlug ? "" : slug);
                    setViewMode("grid");
                  }}
                />
                {mapLocations.length === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-3">
                    No listings match your search in any mapped location.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Listings grid ───────────────────────────────────────────────── */}
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
        ) : noResults ? (
          /* ── No-results empty state ──────────────────────────────────────── */
          <div className="max-w-md mx-auto py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-500 text-sm mb-8">
              We couldn't find anything matching
              {submittedQuery ? ` "${submittedQuery}"` : " your filters"}.
              {!wasAiSearch &&
                " Try AI search — it understands natural language and fuzzy matches."}
            </p>

            {/* AI search nudge — only show if they haven't tried it yet */}
            {!wasAiSearch && submittedQuery && (
              <div className="bg-linear-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 mb-6">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Try AI Search
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  AI search understands phrases like{" "}
                  <em>"cheap car under 5k in Limassol"</em> or{" "}
                  <em>"second-hand iPhone good condition"</em>.
                </p>
                <button
                  onClick={() => handleAiSearch(submittedQuery)}
                  disabled={aiSearching}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-60"
                >
                  {aiSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Search with AI
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setInputValue("");
                setSubmittedQuery("");
                setCategorySlug("");
                setSubcategorySlug("");
                setLocationSlug("");
                setPriceMin("");
                setPriceMax("");
                setListings([]);
                setTotalHits(0);
                setAiInterpretation("");
                setWasAiSearch(false);
                lastInternalQuery.current = "";
                router.replace("/search", { scroll: false });
              }}
              className="text-indigo-600 font-medium hover:underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
            {listings.length < totalHits && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-sm text-gray-400">
                  Showing {listings.length} of {totalHits} listings
                </p>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                    </>
                  ) : (
                    `Load more (${totalHits - listings.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          // Default discovery state — show featured & promoted listings
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-700">
                Featured &amp; Promoted Listings
              </h2>
            </div>
            {featuredLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`${Math.random() + i}`}
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
            ) : featuredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Type something and press Enter to search
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
