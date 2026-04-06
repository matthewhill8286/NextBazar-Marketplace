"use client";

import { Grid3X3, Heart, List, MapPin, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { ConfirmDialog } from "@/app/components/ui";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { FALLBACK_LISTING_IMAGE } from "@/lib/constants";
import { useSaved } from "@/lib/saved-context";
import { createClient } from "@/lib/supabase/client";

type ViewMode = "list" | "grid";

/** Small helper — format price with currency symbol */
function fmtPrice(price: number | null, currency: string): string {
  if (price === null) return "Contact";
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${price.toLocaleString()}`;
}

/** Small helper — relative time */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SavedPage() {
  const router = useRouter();
  const supabase = createClient();
  const { userId } = useAuth();
  const {
    savedIds,
    count,
    toggle,
    isSaved,
    loading: savedLoading,
  } = useSaved();

  // Map of listingId → full listing data
  const [listingMap, setListingMap] = useState<Record<string, any>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const fetchedRef = useRef<Set<string>>(new Set());

  // Auth guard
  useEffect(() => {
    if (!userId) router.push("/auth/login?redirect=/dashboard/saved");
  }, [userId, router]);

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

  // Derive an ordered list — only IDs currently in savedIds, preserving insertion order
  const listings = [...savedIds].map((id) => listingMap[id]).filter(Boolean);

  async function handleClearAll() {
    setClearing(true);
    if (!userId) {
      setClearing(false);
      setShowClearConfirm(false);
      return;
    }
    // Toggle off each saved item through context so count stays in sync
    await Promise.all([...savedIds].map((id) => toggle(id)));
    setClearing(false);
    setShowClearConfirm(false);
  }

  if (savedLoading || pageLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-7 w-36 bg-[#e8e6e3] animate-pulse" />
            <div className="h-4 w-24 bg-[#e8e6e3] animate-pulse" />
          </div>
        </div>
        {/* List skeleton */}
        <div className="space-y-px bg-[#e8e6e3]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white flex gap-4 p-4">
              <div className="w-28 h-20 bg-[#e8e6e3] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 bg-[#e8e6e3] animate-pulse" />
                <div className="h-3 w-1/2 bg-[#e8e6e3] animate-pulse" />
                <div className="h-5 w-20 bg-[#e8e6e3] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Saved Listings
          </h1>
          <p className="text-sm text-[#6b6560] mt-0.5">
            {count} {count === 1 ? "item" : "items"} saved
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          {count > 0 && (
            <div className="flex border border-[#e8e6e3] bg-white">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-[#8E7A6B] text-white"
                    : "text-[#6b6560] hover:text-[#666] hover:bg-[#faf9f7]"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#8E7A6B] text-white"
                    : "text-[#6b6560] hover:text-[#666] hover:bg-[#faf9f7]"
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          )}
          {count > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {listings.length > 0 ? (
        viewMode === "grid" ? (
          /* ── Grid View ─────────────────────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          /* ── List View (default) ───────────────────────────────────── */
          <div className="space-y-px bg-[#e8e6e3] border border-[#e8e6e3]">
            {listings.map((listing) => {
              const cat = listing.categories || listing.category;
              const loc = listing.locations || listing.location;
              const imageSrc =
                listing.primary_image_url || FALLBACK_LISTING_IMAGE;
              const isSold = listing.status === "sold";

              return (
                <div
                  key={listing.id}
                  className="bg-white flex items-center gap-0 group hover:bg-[#faf9f7] transition-colors"
                >
                  {/* Image */}
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="relative w-32 sm:w-40 shrink-0 aspect-4/3 overflow-hidden bg-[#f0eeeb] block"
                  >
                    <Image
                      src={imageSrc}
                      alt={listing.title}
                      fill
                      className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSold ? "opacity-40 grayscale" : ""}`}
                      sizes="160px"
                    />
                    {isSold && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-[#2C2826] text-white text-[9px] font-medium px-3 py-1 tracking-[0.2em] uppercase">
                          Sold
                        </span>
                      </div>
                    )}
                    {listing.is_promoted && !isSold && (
                      <span className="absolute top-2 left-2 bg-[#2C2826] text-white text-[8px] font-medium px-2 py-0.5 tracking-[0.15em] uppercase">
                        Featured
                      </span>
                    )}
                  </Link>

                  {/* Content */}
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="flex-1 min-w-0 px-5 py-4 block"
                  >
                    <h3 className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#8E7A6B] transition-colors">
                      {listing.title}
                    </h3>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6b6560]">
                      {loc?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#8a8280]" />
                          {loc.name}
                        </span>
                      )}
                      {listing.condition && (
                        <span className="capitalize">
                          {listing.condition.replace(/_/g, " ")}
                        </span>
                      )}
                      {cat?.name && (
                        <span className="hidden sm:inline text-[#8a8280]">
                          {cat.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-base font-light text-[#1a1a1a]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {fmtPrice(listing.price, listing.currency)}
                      </span>
                      <span className="text-[11px] text-[#8a8280]">
                        {timeAgo(listing.created_at)}
                      </span>
                    </div>
                  </Link>

                  {/* Inline heart toggle — FavoriteButton uses absolute
                       positioning (for card overlays), so we use a simple
                       inline button here instead */}
                  <div className="pr-4 shrink-0 flex items-center">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await toggle(listing.id);
                      }}
                      className="p-2.5 text-[#6b6560] hover:text-red-500 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isSaved(listing.id) ? "text-red-500 fill-red-500" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-white border border-[#e8e6e3]">
          <Heart className="w-12 h-12 text-[#8a8280] mx-auto mb-3" />
          <h2
            className="text-lg font-light text-[#1a1a1a] mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            No saved listings
          </h2>
          <p className="text-sm text-[#6b6560] mb-6">
            Tap the heart icon on any listing to save it here
          </p>
          <Link
            href="/search"
            className="inline-flex bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-7 py-3 hover:bg-[#7A6657] transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={showClearConfirm}
        title="Remove all saved listings?"
        description="This will unsave all listings from your collection. You can always save them again later."
        confirmLabel="Remove all"
        cancelLabel="Keep"
        confirmClassName="bg-red-500 hover:bg-red-600"
        loading={clearing}
        icon={<Trash2 className="w-8 h-8 text-red-400" />}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
