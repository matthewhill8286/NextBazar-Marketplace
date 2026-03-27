"use client";

import {
  Clock,
  Flame,
  Loader2,
  MapPin,
  Search,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import { formatPrice } from "@/lib/format-helpers";
import { createClient } from "@/lib/supabase/client";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  condition: string | null;
  primary_image_url: string | null;
  is_promoted: boolean;
  categories: { name: string; slug: string } | null;
  locations: { name: string } | null;
};

type TrendingItem = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  primary_image_url: string | null;
  view_count: number;
};

type CategoryChip = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 6;
const MAX_RECENT = 5;
const MAX_TRENDING = 4;

// ─── Recent searches (session-only, not persisted to disk) ──────────────────
let recentSearchesStore: string[] = [];

export default function GlobalSearch() {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations("nav");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] =
    useState<string[]>(recentSearchesStore);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [categories, setCategories] = useState<CategoryChip[]>([]);
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // ── Load trending + categories once on first open ───────────────────────
  const loadSuggestions = useCallback(async () => {
    if (trendingLoaded) return;
    setTrendingLoaded(true);
    const [{ data: trendData }, { data: catData }] = await Promise.all([
      supabase
        .from("listings")
        .select(
          "id, title, slug, price, currency, primary_image_url, view_count",
        )
        .eq("status", "active")
        .order("view_count", { ascending: false })
        .limit(MAX_TRENDING),
      supabase
        .from("categories")
        .select("id, name, slug, icon")
        .order("sort_order")
        .limit(8),
    ]);
    if (trendData) setTrending(trendData as TrendingItem[]);
    if (catData) setCategories(catData as CategoryChip[]);
  }, [supabase, trendingLoaded]);

  // ── Cmd+K / Ctrl+K global shortcut ──────────────────────────────────────
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // ── Debounced search ──────────────────────────────────────────────────────
  const search = useCallback(
    async (q: string, catSlug: string | null) => {
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      let builder = supabase
        .from("listings")
        .select(
          `id, title, slug, price, currency, condition, primary_image_url, is_promoted,
           categories!inner(name, slug), locations(name)`,
        )
        .eq("status", "active")
        .ilike("title", `%${trimmed}%`);

      if (catSlug) {
        builder = builder.eq("categories.slug", catSlug);
      }

      const { data } = await builder
        .order("is_promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(MAX_RESULTS);

      setResults((data as unknown as SearchResult[]) || []);
      setLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(
      () => search(query, activeCategory),
      DEBOUNCE_MS,
    );
    return () => clearTimeout(debounceRef.current as any);
  }, [query, activeCategory, search]);

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Lock body scroll while dropdown is open ─────────────────────────────
  useEffect(() => {
    if (open) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  // ── Recent searches helpers ─────────────────────────────────────────────
  function addRecent(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    recentSearchesStore = [
      trimmed,
      ...recentSearchesStore.filter((s) => s !== trimmed),
    ].slice(0, MAX_RECENT);
    setRecentSearches(recentSearchesStore);
  }

  function removeRecent(q: string) {
    recentSearchesStore = recentSearchesStore.filter((s) => s !== q);
    setRecentSearches(recentSearchesStore);
  }

  // ── Navigate to full search page ────────────────────────────────────────
  function goToSearch(q?: string) {
    const term = (q ?? query).trim();
    if (!term) return;
    addRecent(term);
    const params = new URLSearchParams({ q: term });
    if (activeCategory) params.set("category", activeCategory);
    router.push(`/search?${params.toString()}`, { scroll: false });
    setOpen(false);
    inputRef.current?.blur();
  }

  function goToListing(slug: string) {
    if (query.trim()) addRecent(query.trim());
    router.push(`/listing/${slug}`);
    setOpen(false);
    inputRef.current?.blur();
  }

  // ── Keyboard navigation ─────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (highlighted >= 0 && highlighted < results.length) {
        goToListing(results[highlighted].slug);
      } else {
        goToSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleFocus() {
    setOpen(true);
    loadSuggestions();
  }

  function handleBlur(e: React.FocusEvent) {
    // If focus moves to another element inside the container, keep open
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
  }

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= 2;
  const showSuggestions =
    open && !hasQuery && (recentSearches.length > 0 || trending.length > 0);
  const showResults = open && hasQuery;

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      className="relative flex-1 max-w-xl hidden md:block"
    >
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setActiveCategory(null);
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-400">
              {"Ctrl+"}K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Suggestions dropdown (empty state) ───────────────────────────── */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="px-3.5 pt-3 pb-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t("recentSearches")}
              </p>
              <div className="space-y-0.5">
                {recentSearches.map((term) => (
                  <div key={term} className="flex items-center group">
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        goToSearch(term);
                      }}
                      className="flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(term)}
                      className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="px-3.5 pt-3 pb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t("categories")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const cfg = getCategoryConfig(cat.slug);
                  return (
                    <Link
                      key={cat.id}
                      href={`/search?category=${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:shadow-sm ${cfg.bg} ${cfg.color} border-transparent hover:border-current/10`}
                    >
                      <CategoryIcon slug={cat.slug} size={13} />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending */}
          {trending.length > 0 && (
            <div className="px-3.5 pt-3 pb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t("trending")}
              </p>
              <div className="space-y-0.5">
                {trending.map((item) => (
                  <Link
                    key={item.id}
                    href={`/listing/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                      {item.primary_image_url ? (
                        <Image
                          src={item.primary_image_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">
                          {formatPrice(item.price, item.currency)}
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Flame className="w-3 h-3" />
                          {item.view_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Results dropdown (active query) ──────────────────────────────── */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Category quick-filter chips */}
          {categories.length > 0 && (
            <div className="px-3.5 pt-3 pb-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    !activeCategory
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("allCategories")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setActiveCategory(
                        activeCategory === cat.slug ? null : cat.slug,
                      )
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeCategory === cat.slug
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <CategoryIcon slug={cat.slug} size={12} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">
                {t("noResults", { query: trimmedQuery })}
              </p>
              <button
                type="button"
                onClick={() => goToSearch()}
                className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {t("tryFullSearch")}
              </button>
            </div>
          ) : (
            <>
              <ul>
                {results.map((r, i) => (
                  <li key={r.id}>
                    <Link
                      href={`/listing/${r.slug}`}
                      onClick={() => {
                        addRecent(trimmedQuery);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors ${
                        highlighted === i ? "bg-indigo-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                        {r.primary_image_url ? (
                          <Image
                            src={r.primary_image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                            📦
                          </div>
                        )}
                        {r.is_promoted && (
                          <span className="absolute top-0 left-0 bg-amber-500 text-white text-[7px] font-bold px-1 py-px rounded-br">
                            AD
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {r.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span className="font-semibold text-gray-800">
                            {formatPrice(r.price, r.currency)}
                          </span>
                          {r.categories?.name && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-0.5">
                                <Tag className="w-3 h-3" />
                                {r.categories.name}
                              </span>
                            </>
                          )}
                          {r.locations?.name && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {r.locations.name}
                              </span>
                            </>
                          )}
                          {r.condition && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="capitalize">{r.condition}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Footer: view all results */}
              <div className="border-t border-gray-100 px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => goToSearch()}
                  className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  {t("viewAllResults", { query: trimmedQuery })}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
