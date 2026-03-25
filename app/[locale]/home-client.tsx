"use client";

import {
  Bot,
  Clock,
  Flame,
  MessageCircle,
  Shield,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import ListingCard from "@/app/components/listing-card";
import { ShopCardCompact } from "@/app/[locale]/shops/shops-client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/client";
import { CARD_SELECT } from "@/lib/supabase/selects";
import type { ShopCardRow } from "@/lib/supabase/queries";
import type { Category, ListingCardRow } from "@/lib/supabase/supabase.types";
import { LAST_SEARCH_LOCATION_KEY } from "@/lib/constants";

type Props = {
  initialCategories?: Category[];
  initialFeatured?: ListingCardRow[];
  initialRecent?: ListingCardRow[];
  initialTotalCount?: number;
  initialFeaturedShops?: ShopCardRow[];
};

export default function HomeClient({
  initialCategories = [],
  initialFeatured = [],
  initialRecent = [],
  initialTotalCount = 0,
  initialFeaturedShops = [],
}: Props) {
  const supabase = createClient();
  const [categories] = useState<Category[]>(initialCategories);
  const [featured] = useState<ListingCardRow[]>(initialFeatured);
  const [recent] = useState<ListingCardRow[]>(initialRecent);
  const [trending, setTrending] = useState<ListingCardRow[]>([]);
  const [trendingLocationName, setTrendingLocationName] = useState<
    string | null
  >(null);
  const [trendingLocationSlug, setTrendingLocationSlug] = useState<
    string | null
  >(null);
  const [recentlyViewed, setRecentlyViewed] = useState<ListingCardRow[]>([]);
  const [totalCount] = useState(initialTotalCount);
  // Public data (categories, featured, recent) comes from the server.
  // Only user-personalised data (trending, recently viewed) needs to load client-side.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // ── Trending in your area ─────────────────────────────────────────
      let locationId: string | null = null;
      let locationName: string | null = null;
      let locationSlug: string | null = null;
      try {
        const storedSlug = localStorage.getItem(LAST_SEARCH_LOCATION_KEY);
        if (storedSlug) {
          const { data: loc } = await supabase
            .from("locations")
            .select("id, name, slug")
            .eq("slug", storedSlug)
            .single();
          if (loc) {
            locationId = loc.id;
            locationName = loc.name;
            locationSlug = loc.slug;
          }
        }
      } catch {}

      // Query: top listings by view_count in that area (fall back to all Cyprus)
      let trendingQ = supabase
        .from("listings")
        .select(CARD_SELECT)
        .eq("status", "active")
        .order("view_count", { ascending: false })
        .limit(8);

      if (locationId) trendingQ = trendingQ.eq("location_id", locationId);

      const { data: trendData } = await trendingQ;

      // If the area has fewer than 3 listings, fall back to all-Cyprus trending
      if (!trendData || trendData.length < 3) {
        const { data: fallback } = await supabase
          .from("listings")
          .select(CARD_SELECT)
          .eq("status", "active")
          .order("view_count", { ascending: false })
          .limit(8);
        setTrending((fallback || []) as unknown as ListingCardRow[]);
        setTrendingLocationName(null);
        setTrendingLocationSlug(null);
      } else {
        setTrending(trendData as unknown as ListingCardRow[]);
        setTrendingLocationName(locationName);
        setTrendingLocationSlug(locationSlug);
      }

      // ── Recently Viewed ───────────────────────────────────────────────
      try {
        const stored = localStorage.getItem("recentlyViewed");
        if (stored) {
          const ids: string[] = JSON.parse(stored);
          if (ids.length > 0) {
            const { data: rvData } = await supabase
              .from("listings")
              .select(CARD_SELECT)
              .in("id", ids.slice(0, 8));
            if (rvData && rvData.length > 0) {
              // Preserve the localStorage order (most recently viewed first)
              const idOrder = ids.slice(0, 8);
              const sorted = idOrder
                .map((id) => rvData.find((l) => l.id === id))
                .filter((l) => l != null) as unknown as ListingCardRow[];
              setRecentlyViewed(sorted);
            }
          }
        }
      } catch {}

      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/home-hero.jpg)`,
          }}
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/75 via-indigo-900/65 to-indigo-950/80" />
        {/* Dot mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Cyprus&rsquo;s smartest marketplace
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-[1.1] drop-shadow-lg">
            Buy &amp; Sell{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-orange-300">
                Anything
              </span>
            </span>{" "}
            in Cyprus
          </h1>

          <p className="text-white/85 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            AI-powered search, instant messaging, and verified sellers — all in
            one place.
          </p>

          {/* Stats chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              {
                icon: TrendingUp,
                label: `${totalCount.toLocaleString()}+ Active Listings`,
              },
              { icon: Shield, label: "Verified Sellers" },
              { icon: Bot, label: "AI-Powered" },
              { icon: MessageCircle, label: "Real-time Chat" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2 rounded-full text-sm text-white/90 font-medium"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-200" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ── Categories ──────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Browse Categories
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Find exactly what you&rsquo;re looking for
              </p>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`${Math.random() + i}`}
                  className="bg-white rounded-2xl p-3 border border-gray-100 h-24 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {categories.map((cat, i) => {
                const palettes = [
                  "from-indigo-50 to-indigo-50 hover:from-indigo-100 hover:to-indigo-100 border-indigo-100",
                  "from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-100",
                  "from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-100",
                  "from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-rose-100",
                  "from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-violet-100",
                  "from-cyan-50 to-sky-50 hover:from-cyan-100 hover:to-sky-100 border-cyan-100",
                  "from-lime-50 to-green-50 hover:from-lime-100 hover:to-green-100 border-lime-100",
                  "from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-100",
                ];
                // Dedicated landing pages for property & vehicles
                const LANDING_PAGES: Record<string, string> = {
                  property: "/properties",
                  vehicles: "/vehicles",
                };
                const href =
                  LANDING_PAGES[cat.slug] ?? `/search?category=${cat.slug}`;
                return (
                  <Link
                    key={cat.id}
                    href={href}
                    className={`bg-linear-to-br ${palettes[i % palettes.length]} rounded-2xl p-3 border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center group`}
                  >
                    <div
                      className={`w-10 h-10 ${getCategoryConfig(cat.slug).bg} rounded-xl flex items-center justify-center mb-1.5 mx-auto group-hover:scale-110 transition-transform duration-200`}
                    >
                      <CategoryIcon slug={cat.slug} size={20} />
                    </div>
                    <div className="text-xs font-semibold text-gray-700 leading-tight">
                      {cat.name}
                    </div>
                    {cat.listing_count > 0 && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {cat.listing_count.toLocaleString()}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Featured Listings ────────────────────────────────────────── */}
        {!loading && featured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-linear-to-b from-amber-400 to-orange-500 rounded-full" />
                <h2 className="text-xl font-bold text-gray-900">
                  Featured Listings
                </h2>
                <span className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Promoted
                </span>
              </div>
              <Link
                href="/search"
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Shops ───────────────────────────────────────────── */}
        {FEATURE_FLAGS.DEALERS &&
          !loading &&
          initialFeaturedShops.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-linear-to-b from-purple-500 to-indigo-600 rounded-full" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Pro Seller Shops
                  </h2>
                  <span className="flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    <Store className="w-3 h-3" />
                    Premium
                  </span>
                </div>
                <Link
                  href="/shops"
                  className="text-sm text-indigo-600 font-semibold hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {initialFeaturedShops.map((shop) => (
                  <ShopCardCompact key={shop.id} shop={shop} />
                ))}
              </div>
            </section>
          )}

        {/* ── Trending in Your Area ────────────────────────────────────── */}
        {!loading && trending.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-linear-to-b from-orange-400 to-red-500 rounded-full" />
                <h2 className="text-xl font-bold text-gray-900">
                  {trendingLocationName
                    ? `Trending in ${trendingLocationName}`
                    : "Trending Now"}
                </h2>
                <span className="flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  <Flame className="w-3 h-3" />
                  Hot
                </span>
              </div>
              <Link
                href={
                  trendingLocationSlug
                    ? `/search?location=${trendingLocationSlug}&sort=popular`
                    : "/search?sort=popular"
                }
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trending.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Viewed ──────────────────────────────────────────── */}
        {!loading && recentlyViewed.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-linear-to-b from-violet-500 to-purple-600 rounded-full" />
                <h2 className="text-xl font-bold text-gray-900">
                  Recently Viewed
                </h2>
                <span className="flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  <Clock className="w-3 h-3" />
                  History
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("recentlyViewed");
                  } catch {}
                  setRecentlyViewed([]);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear history
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewed.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recently Added ───────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-linear-to-b from-indigo-500 to-indigo-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">
                {!loading && recent.length === 0
                  ? "No listings yet"
                  : "Recently Added"}
              </h2>
            </div>
            {recent.length > 0 && (
              <Link
                href="/search"
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                View all →
              </Link>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`${Math.random() + i}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  <div className="aspect-4/3 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-gray-100 rounded-lg animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg animate-pulse w-1/2" />
                    <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Be the first to post!
              </h3>
              <p className="text-gray-400 mb-6">
                The marketplace is waiting for listings
              </p>
              <Link
                href="/post"
                className="inline-flex bg-linear-to-r from-indigo-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                Post Your First Ad
              </Link>
            </div>
          )}
        </section>

        {/* ── Why NextBazar ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-linear-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white mb-4">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <div className="text-center mb-10">
              <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">
                Why NextBazar
              </p>
              <h2 className="text-2xl md:text-3xl font-bold">
                The smarter way to trade
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Bot,
                  color: "from-indigo-500 to-indigo-600",
                  title: "AI-Powered Listings",
                  desc: "Upload photos and let AI auto-fill your listing details. Get smart pricing suggestions based on live market data.",
                },
                {
                  icon: Shield,
                  color: "from-emerald-500 to-teal-600",
                  title: "Trust & Safety",
                  desc: "Verified sellers, user reviews, and AI-powered spam detection keep the marketplace safe and trustworthy.",
                },
                {
                  icon: MessageCircle,
                  color: "from-violet-500 to-purple-600",
                  title: "Instant Communication",
                  desc: "Real-time messaging, instant notifications, and secure in-app communication between buyers and sellers.",
                },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="text-center group">
                  <div
                    className={`w-14 h-14 bg-linear-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/post"
                className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white px-7 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-900/30"
              >
                Post a Free Ad
              </Link>
              <Link
                href="/search"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-7 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
