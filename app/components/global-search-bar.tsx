"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, KeyboardEvent } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";

type Variant = "hero" | "navbar";

interface Props {
  variant?: Variant;
  initialValue?: string;
}

export default function GlobalSearchBar({ variant = "navbar", initialValue = "" }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialValue);
  const [aiLoading, setAiLoading] = useState(false);

  function goToSearch(q: string, ai = false) {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (ai) params.set("ai", "1");
    router.push(`/search?${params.toString()}`);
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
    // Navigate immediately — search page will auto-fire the AI search
    goToSearch(query, true);
    // Brief delay so the loading indicator is visible before unmount
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
        {/* AI button */}
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
        {/* Search button */}
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
  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3.5 text-gray-400 w-4 h-4 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Search thousands of listings..."
        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 hover:border-blue-300 hover:bg-white focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
      />
      {/* AI sparkle button */}
      <button
        onClick={handleAi}
        disabled={aiLoading}
        title="AI smart search"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-60"
      >
        {aiLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
