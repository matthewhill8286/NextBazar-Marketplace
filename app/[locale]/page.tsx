import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import { EmptyListingsIllustration } from "@/app/components/illustrations";
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
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#2C2826]"
        aria-label="Homepage hero"
      >
        {/* Background image — uses Next.js Image with priority for fast LCP */}
        <Image
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/hero-poster.jpg`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#2C2826]/75" />

        {/* Content */}
        <div className="relative w-full max-w-7xl mx-auto px-6 py-24">
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-white/80 mb-8">
            Cyprus&rsquo;s premier marketplace
          </p>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[1.05] mb-8 max-w-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Discover <span className="italic">anything</span>
            <br />
            in Cyprus
          </h1>

          <p className="text-white/90 text-lg md:text-xl max-w-xl leading-relaxed mb-12">
            Smart search, instant messaging, verified sellers. A marketplace
            designed for the way you actually want to buy and sell.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/post"
              className="group inline-flex items-center gap-3 bg-white text-[#1a1a1a] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#f0eeeb] transition-colors"
            >
              Post a free ad
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/search"
              className="group inline-flex items-center gap-3 border border-white/60 text-white px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
            >
              Browse listings
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────── */}
      <section
        className="max-w-7xl mx-auto px-6 pt-24 pb-20"
        aria-label="Browse by category"
      >
        <div className="text-center mb-14">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-4">
            Explore
          </p>
          <h2
            className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Browse by Category
          </h2>
        </div>
        {/** biome-ignore lint/a11y/useSemanticElements: we want the div because of the link child */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list">
          {categories.map((cat) => {
            const href =
              LANDING_PAGES[cat.slug] ?? `/search?category=${cat.slug}`;
            const cfg = getCategoryConfig(cat.slug);
            return (
              // biome-ignore lint/a11y/useSemanticElements: we need to keep the Link here
              <Link
                key={cat.id}
                href={href}
                role="listitem"
                aria-label={`${cat.name} — ${cat.listing_count} listings`}
                className="group relative bg-white border border-[#e8e6e3] p-6 text-center transition-all duration-500 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-[#ccc]"
              >
                <div
                  className={`w-14 h-14 ${cfg.bg} rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-500`}
                >
                  <CategoryIcon slug={cat.slug} size={24} />
                </div>
                <div className="text-sm font-medium text-[#1a1a1a] tracking-wide">
                  {cat.name}
                </div>
                {cat.listing_count > 0 && (
                  <div className="text-[10px] text-[#888] mt-1 tracking-wider">
                    {cat.listing_count.toLocaleString()} listings
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured Listings ────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-white" aria-label="Featured listings">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-4">
                  Promoted
                </p>
                <h2
                  className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Featured Listings
                </h2>
              </div>
              <Link
                href="/search"
                className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#888] hover:text-[#1a1a1a] transition-colors"
              >
                View all
                <ArrowRight
                  className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Suspense>
                {featured.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </Suspense>
            </div>
          </div>
        </section>
      )}

      {/* ── Trending ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6">
        <Suspense>
          <TrendingSection fallbackTrending={trending} />
        </Suspense>

        {/* ── Recently Viewed ──────────────────────────────────────────── */}
        <Suspense>
          <RecentlyViewedSection />
        </Suspense>
      </div>

      {/* ── Recently Added ───────────────────────────────────────────── */}
      <section
        className="max-w-7xl mx-auto px-6 py-20"
        aria-label="Recently added listings"
      >
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-4">
              New arrivals
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {recent.length === 0 ? "No Listings Yet" : "Just Listed"}
            </h2>
          </div>
          {recent.length > 0 && (
            <Link
              href="/search"
              className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#888] hover:text-[#1a1a1a] transition-colors"
            >
              View all
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
        {recent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recent.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border border-[#e8e6e3]">
            <EmptyListingsIllustration className="w-20 h-20 mx-auto mb-6 text-[#ccc]" />
            <h3
              className="text-2xl font-light text-[#1a1a1a] mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Be the first to post
            </h3>
            <p className="text-[#888] mb-8 max-w-sm mx-auto text-sm">
              The marketplace is brand new. Get ahead of the crowd and list
              something today.
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-3 bg-[#8E7A6B] text-white px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#7A6657] transition-colors"
            >
              Post your first ad
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* ── Why NextBazar ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#2C2826] text-white"
        aria-label="Why choose NextBazar"
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/70 mb-4">
              Why NextBazar
            </p>
            <h2
              className="text-3xl md:text-5xl font-light"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Built <span className="italic">different</span>, on purpose
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              {
                num: "01",
                title: "AI That Saves You Time",
                desc: "Upload photos and AI fills out your listing. Get pricing suggestions based on what similar items actually sell for.",
              },
              {
                num: "02",
                title: "Trust You Can Verify",
                desc: "Verified sellers, real reviews, and automated spam detection. Every transaction happens between real people.",
              },
              {
                num: "03",
                title: "Talk, Don't Wait",
                desc: "Real-time messaging that actually works. No email chains, no phone tag. Just direct conversations.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num}>
                <div className="text-[11px] font-medium tracking-[0.3em] text-white/40 mb-6">
                  {num}
                </div>
                <h3
                  className="text-xl md:text-2xl font-light text-white mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/post"
              className="group inline-flex items-center gap-3 bg-white text-[#1a1a1a] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#f0eeeb] transition-colors"
            >
              Start selling
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/search"
              className="group inline-flex items-center gap-3 border border-white/60 text-white px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
            >
              Browse listings
              <ArrowRight
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
