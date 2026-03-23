"use client";

import { ChevronDown, Loader2, Search, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Variant = "hero" | "navbar";
type Category = { id: string; name: string; slug: string; icon: string };

interface Props {
  variant?: Variant;
}

export default function GlobalSearchBar({ variant = "navbar" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // ── Always mirror the URL's ?q= value so both bars stay in sync ──────────
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  // Load categories once
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("id, name, slug, icon")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, []);

  const isOnSearchPage = pathname === "/search";

  function goToSearch(q: string, ai = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }
    if (ai) {
      params.set("ai", "1");
    } else {
      params.delete("ai");
    }
    const url = `/search?${params.toString()}`;
    if (isOnSearchPage) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      goToSearch(query);
    }
  }

  async function handleAi() {
    if (aiLoading) return;
    setAiLoading(true);
    goToSearch(query, true);
    setTimeout(() => setAiLoading(false), 600);
  }

  // ─────────────────────────────── HERO variant ────────────────────────────
  if (variant === "hero") {
    return (
      <div className="relative flex items-center max-w-2xl mx-auto mb-10">
        <Search className="absolute left-5 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="What are you looking for?"
          className="w-full pl-14 pr-44 py-4 rounded-2xl bg-white text-gray-800 placeholder:text-gray-400 text-base shadow-2xl shadow-indigo-900/30 focus:outline-none focus:shadow-indigo-900/50 transition-shadow"
        />
        <button
          onClick={handleAi}
          disabled={aiLoading}
          title="AI smart search"
          className="absolute right-[7.5rem] top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-60 group"
        >
          {aiLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
          ) : (
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs font-semibold hidden sm:inline">AI</span>
        </button>
        <button
          onClick={() => goToSearch(query)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          Search
        </button>
      </div>
    );
  }

  // ────────────────────────────── NAVBAR variant ────────────────────────────
  // Hide the navbar search on the search page — the page has its own search bar
  if (isOnSearchPage) return null;

  const activeCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="flex items-center w-full rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-white focus-within:border-blue-400 focus-within:bg-white transition-all overflow-hidden">
      {/* Category picker */}
      <div className="relative shrink-0">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="appearance-none h-full pl-3 pr-7 py-2.5 bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer border-r border-gray-200"
          aria-label="Category"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
      </div>

      {/* Text input */}
      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            activeCategory
              ? `Search in ${activeCategory.name}…`
              : "Search thousands of listings..."
          }
          className="w-full pl-3 pr-9 py-2.5 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          onClick={handleAi}
          disabled={aiLoading}
          title="AI smart search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-60"
        >
          {aiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
