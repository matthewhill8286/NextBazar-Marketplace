"use client";

import { Bell, ExternalLink, Loader2, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SavedSearch = {
  id: string;
  name: string;
  query: string | null;
  category_slug: string | null;
  subcategory_slug: string | null;
  location_slug: string | null;
  price_min: number | null;
  price_max: number | null;
  sort_by: string | null;
  created_at: string;
  last_notified_at: string | null;
};

function buildSearchUrl(s: SavedSearch) {
  const params = new URLSearchParams();
  if (s.query) params.set("q", s.query);
  if (s.category_slug) params.set("category", s.category_slug);
  if (s.subcategory_slug) params.set("subcategory", s.subcategory_slug);
  if (s.location_slug) params.set("location", s.location_slug);
  if (s.sort_by && s.sort_by !== "newest") params.set("sort", s.sort_by);
  if (s.price_min != null) params.set("priceMin", String(s.price_min));
  if (s.price_max != null) params.set("priceMax", String(s.price_max));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

function buildTags(s: SavedSearch) {
  const tags: string[] = [];
  if (s.category_slug) tags.push(s.category_slug);
  if (s.location_slug) tags.push(s.location_slug);
  if (s.price_min != null && s.price_max != null)
    tags.push(`€${s.price_min}–€${s.price_max}`);
  else if (s.price_min != null) tags.push(`from €${s.price_min}`);
  else if (s.price_max != null) tags.push(`up to €${s.price_max}`);
  return tags;
}

export default function SavedSearchesClient({
  initialSearches,
}: {
  initialSearches: SavedSearch[];
}) {
  const supabase = createClient();
  const [searches, setSearches] = useState(initialSearches);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("saved_searches").delete().eq("id", id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Saved Searches</h1>
          <p className="text-sm text-[#6b6560] mt-0.5">
            You'll be alerted when new listings match your saved searches.
          </p>
        </div>
        <Link
          href="/search"
          className="flex items-center gap-2 px-4 py-2 bg-[#8E7A6B] text-white text-sm font-medium hover:bg-[#7A6657] transition-colors"
        >
          <Search className="w-4 h-4" />
          New Search
        </Link>
      </div>

      {searches.length === 0 ? (
        <div className="bg-white border border-[#e8e6e3] p-16 text-center">
          <div className="w-14 h-14 bg-[#f0eeeb] rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-[#8E7A6B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">
            No saved searches yet
          </h3>
          <p className="text-[#6b6560] text-sm mb-6">
            Save a search on the search page and we'll alert you when new
            matching listings appear.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8E7A6B] text-white text-sm font-medium hover:bg-[#7A6657] transition-colors"
          >
            <Search className="w-4 h-4" />
            Go to Search
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7]">
          {searches.map((s) => {
            const tags = buildTags(s);
            return (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 hover:bg-[#faf9f7]/50 transition-colors"
              >
                <div className="w-10 h-10 bg-[#f0eeeb] flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-[#8E7A6B]" />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={buildSearchUrl(s)}
                    className="font-medium text-[#1a1a1a] hover:text-[#8E7A6B] transition-colors"
                  >
                    {s.name}
                  </Link>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-[#f0eeeb] text-[#666] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-[#8a8280] mt-1">
                    Saved{" "}
                    {new Date(s.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {s.last_notified_at && (
                      <>
                        {" "}
                        · Last alert{" "}
                        {new Date(s.last_notified_at).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" },
                        )}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={buildSearchUrl(s)}
                    className="p-2 text-[#8a8280] hover:text-[#8E7A6B] hover:bg-[#f0eeeb] transition-colors"
                    title="Run search"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="p-2 text-[#8a8280] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 p-4 text-sm text-amber-700">
        <strong>How alerts work:</strong> When a new listing is posted that
        matches one of your saved searches, you'll receive an email
        notification. Make sure your email address is verified in{" "}
        <Link href="/dashboard/settings" className="underline font-medium">
          Account Settings
        </Link>
        .
      </div>
    </div>
  );
}
