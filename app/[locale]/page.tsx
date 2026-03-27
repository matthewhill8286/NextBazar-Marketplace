import { Bot, MessageCircle, Shield, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import ListingCard from "@/app/components/listing-card";
import {
  getActiveListingCountCached,
  getCategoriesCached,
  getFeaturedListingsCached,
  getRecentListingsCached,
  getTrendingListingsCached,
} from "@/lib/supabase/queries";

import RecentlyViewedSection from "./recently-viewed-section";
import TrendingSection from "./trending-section";

const CATEGORY_PALETTES = [
  "from-indigo-50 to-indigo-50 hover:from-indigo-100 hover:to-indigo-100 border-indigo-100",
  "from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-100",
  "from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-100",
  "from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-rose-100",
  "from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 border-violet-100",
  "from-cyan-50 to-sky-50 hover:from-cyan-100 hover:to-sky-100 border-cyan-100",
  "from-lime-50 to-green-50 hover:from-lime-100 hover:to-green-100 border-lime-100",
  "from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-100",
];

const LANDING_PAGES: Record<string, string> = {
  property: "/properties",
  vehicles: "/vehicles",
};

export default async function Home() {
  const [categories, featured, recent, totalCount, trending] =
    await Promise.all([
      getCategoriesCached(),
      getFeaturedListingsCached(),
      getRecentListingsCached(),
      getActiveListingCountCached(),
      getTrendingListingsCached(),
    ]);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/home-hero.jpg)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/75 via-indigo-900/65 to-indigo-950/80" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Cyprus&rsquo;s smartest marketplace
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 tracking-tight leading-[1.1] drop-shadow-sm">
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
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map((cat, i) => {
              const href =
                LANDING_PAGES[cat.slug] ?? `/search?category=${cat.slug}`;
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={`bg-linear-to-br ${CATEGORY_PALETTES[i % CATEGORY_PALETTES.length]} rounded-2xl p-3 border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center group`}
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
        </section>

        {/* ── Featured Listings ────────────────────────────────────────── */}
        {featured.length > 0 && (
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
              <Suspense>
                {featured.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </Suspense>
            </div>
          </section>
        )}

        {/* ── Trending in Your Area (client — needs localStorage) ───── */}
        <Suspense>
          <TrendingSection fallbackTrending={trending} />
        </Suspense>

        {/* ── Recently Viewed (client — needs localStorage) ──────────── */}
        <Suspense>
          <RecentlyViewedSection />
        </Suspense>

        {/* ── Recently Added ───────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-linear-to-b from-indigo-500 to-indigo-500 rounded-full" />
              <h2 className="text-xl font-bold text-gray-900">
                {recent.length === 0 ? "No listings yet" : "Recently Added"}
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
          {recent.length > 0 ? (
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
                    className={`w-14 h-14 bg-linear-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform duration-200`}
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
                className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white px-7 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm shadow-indigo-900/30"
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
