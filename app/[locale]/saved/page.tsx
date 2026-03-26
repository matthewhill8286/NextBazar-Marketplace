"use client";

import { Heart, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { useSaved } from "@/lib/saved-context";
import { createClient } from "@/lib/supabase/client";

export default function SavedPage() {
  const router = useRouter();
  const supabase = createClient();
  const { savedIds, count, toggle, loading: savedLoading } = useSaved();

  // Map of listingId → full listing data
  const [listingMap, setListingMap] = useState<Record<string, any>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const fetchedRef = useRef<Set<string>>(new Set());

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth/login?redirect=/dashboard/saved");
    });
  }, []);

  // Fetch listing data for any IDs not yet in the map
  useEffect(() => {
    if (savedLoading) return;

    const missing = [...savedIds].filter((id) => !fetchedRef.current.has(id));

    if (missing.length === 0) {
      setPageLoading(false);
      return;
    }

    supabase
      .from("listings")
      .select("*, categories(name, slug, icon), locations(name, slug)")
      .in("id", missing)
      .then(({ data }) => {
        if (data) {
          const newEntries = Object.fromEntries(data.map((l) => [l.id, l]));
          missing.forEach((id) => {
            fetchedRef.current.add(id);
          });
          setListingMap((prev) => ({ ...prev, ...newEntries }));
        }
        setPageLoading(false);
      });
  }, [savedIds, savedLoading]);

  // Derive ordered list — only IDs currently in savedIds, preserving insertion order
  const listings = [...savedIds].map((id) => listingMap[id]).filter(Boolean);

  async function handleClearAll() {
    if (!confirm("Remove all saved listings?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    // Toggle off each saved item through context so count stays in sync
    await Promise.all([...savedIds].map((id) => toggle(id)));
  }

  if (savedLoading || pageLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="h-40 w-full bg-gray-200 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {count} {count === 1 ? "item" : "items"} saved
          </p>
        </div>
        {count > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No saved listings
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Tap the heart icon on any listing to save it here
          </p>
          <Link
            href="/"
            className="inline-flex bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  );
}
