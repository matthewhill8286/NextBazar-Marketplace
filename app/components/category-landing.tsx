"use client";

import {
  ArrowRight,
  BarChart3,
  Clock,
  type LucideIcon,
  MapPin,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ListingCard from "@/app/components/listing-card";
import type {
  ListingCardRow,
  Subcategory,
} from "@/lib/supabase/supabase.types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TabConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Subcategory slugs that belong to this tab */
  subcategorySlugs: string[];
  /** If true, filter to listings from dealer profiles only */
  filterByDealer?: boolean;
};

type Props = {
  categorySlug: string;
  categoryName: string;
  headline: string;
  subheadline: string;
  tabs: TabConfig[];
  subcategories: Subcategory[];
  featuredListings: ListingCardRow[];
  recentListings: ListingCardRow[];
  /** Currency symbol shown in stats bar */
  currency?: string;
  /** CTA label for the post button */
  postLabel?: string;
  /** Optional hero background image URL */
  heroImage?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filterListings(
  listings: ListingCardRow[],
  tabConfig: TabConfig | undefined,
  subcategories: Subcategory[],
): ListingCardRow[] {
  if (!tabConfig) return listings;

  // Dealer filter — show only listings from dealer profiles
  if (tabConfig.filterByDealer) {
    return listings.filter(
      (l) =>
        l.profiles &&
        typeof l.profiles === "object" &&
        "is_pro_seller" in l.profiles &&
        (l.profiles as { is_pro_seller?: boolean }).is_pro_seller === true,
    );
  }

  // Subcategory filter
  if (tabConfig.subcategorySlugs.length === 0) return listings;

  const matchingSubs = subcategories.filter((sc) =>
    tabConfig.subcategorySlugs.includes(sc.slug),
  );
  if (matchingSubs.length === 0) return listings;

  const subIds = new Set(matchingSubs.map((sc) => sc.id));
  return listings.filter(
    (l) =>
      "subcategory_id" in l &&
      subIds.has((l as Record<string, unknown>).subcategory_id as string),
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CategoryLanding({
  categorySlug,
  categoryName,
  headline,
  subheadline,
  tabs,
  subcategories,
  featuredListings,
  recentListings,
  currency = "€",
  postLabel = "Post a Listing",
  heroImage,
}: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "");

  const activeTabConfig = tabs.find((t) => t.key === activeTab);

  // Subcategory pills for the active tab
  const tabSubcategories = subcategories.filter((sc) =>
    activeTabConfig?.subcategorySlugs.includes(sc.slug),
  );

  // Filter both sets of listings by the active tab
  const displayFeatured = filterListings(
    featuredListings,
    activeTabConfig,
    subcategories,
  );
  const displayRecent = filterListings(
    recentListings,
    activeTabConfig,
    subcategories,
  );

  // Derive stats dynamically from the filtered listings for the active tab
  const allTabListings = [...displayFeatured, ...displayRecent];
  // Deduplicate by id (a listing could appear in both featured and recent)
  const uniqueMap = new Map(allTabListings.map((l) => [l.id, l]));
  const uniqueListings = Array.from(uniqueMap.values());

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  const tabStats = {
    total: uniqueListings.length,
    newThisWeek: uniqueListings.filter(
      (l) => now - new Date(l.created_at).getTime() < oneWeekMs,
    ).length,
    avgPrice:
      uniqueListings.length > 0
        ? Math.round(
            uniqueListings.reduce((sum, l) => sum + (l.price ?? 0), 0) /
              uniqueListings.length,
          )
        : 0,
  };

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt=""
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[#2C2826]/65" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#2C2826]" />
        )}

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/40 mb-4">
              {tabStats.total.toLocaleString()} listings available
            </p>

            <h1
              className="text-3xl md:text-5xl font-light mb-4 leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {headline}
            </h1>
            <p className="text-white/50 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
              {subheadline}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/search?category=${categorySlug}`}
                className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-white/90 transition-colors"
              >
                <Search className="w-4 h-4" />
                Browse All {categoryName}
              </Link>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 border border-white/20 text-white text-xs font-medium tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {postLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-[#666]">
              <BarChart3 className="w-4 h-4 text-[#bbb]" />
              <span className="font-semibold text-[#1a1a1a]">
                {tabStats.total.toLocaleString()}
              </span>{" "}
              listings available
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
            <div className="flex items-center gap-2 text-[#666]">
              <Clock className="w-4 h-4 text-[#bbb]" />
              <span className="font-semibold text-[#1a1a1a]">
                {tabStats.newThisWeek.toLocaleString()}
              </span>{" "}
              new this week
            </div>
            {tabStats.avgPrice > 0 && (
              <>
                <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
                <div className="flex items-center gap-2 text-[#666]">
                  <TrendingUp className="w-4 h-4 text-[#bbb]" />
                  avg price{" "}
                  <span className="font-semibold text-[#1a1a1a]">
                    {currency}
                    {tabStats.avgPrice.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ── Tab Navigation ──────────────────────────────────────────── */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#8E7A6B] text-white shadow-sm shadow-[#8E7A6B]/10"
                    : "bg-[#faf9f7] text-[#666] hover:bg-[#f0eeeb] hover:text-[#1a1a1a]"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Active Tab Description + Subcategory Pills ──────────────── */}
        {activeTabConfig && (
          <div className="mb-8">
            <p className="text-[#999] text-sm mb-4">
              {activeTabConfig.description}
            </p>
            {tabSubcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tabSubcategories.map((sc) => (
                  <Link
                    key={sc.id}
                    href={`/search?category=${categorySlug}&subcategory=${sc.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#faf9f7] text-[#666] border border-[#e8e6e3] hover:bg-[#f0eeeb] hover:border-[#ccc] transition-colors"
                  >
                    {sc.name}
                    <ArrowRight className="w-3 h-3 text-[#bbb]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Featured Listings ────────────────────────────────────────── */}
        {displayFeatured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-xl font-light text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Featured {categoryName}
                </h2>
                <p className="text-sm text-[#bbb] mt-0.5">
                  Promoted listings from verified sellers
                </p>
              </div>
              <Link
                href={`/search?category=${categorySlug}&sort=promoted`}
                className="text-sm font-medium text-[#1a1a1a] hover:text-[#666] flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayFeatured.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* ── Listings by Location ─────────────────────────────────────── */}
        {(() => {
          // Group recent listings by location
          const byLocation = new Map<
            string,
            { slug: string; listings: ListingCardRow[] }
          >();
          for (const listing of displayRecent) {
            const locName = listing.locations?.name ?? "Other";
            const locSlug = listing.locations?.slug ?? "";
            if (!byLocation.has(locName)) {
              byLocation.set(locName, { slug: locSlug, listings: [] });
            }
            byLocation.get(locName)!.listings.push(listing);
          }

          const locationGroups = Array.from(byLocation.entries())
            .sort((a, b) => b[1].listings.length - a[1].listings.length);

          if (locationGroups.length === 0) {
            return (
              <section className="mb-12">
                <div className="text-center py-16 text-[#bbb]">
                  <p className="text-lg font-medium mb-1">
                    No {activeTabConfig?.label.toLowerCase() ?? ""} listings yet
                  </p>
                  <p className="text-sm">
                    Be the first to{" "}
                    <Link
                      href="/post"
                      className="text-[#1a1a1a] font-medium hover:underline"
                    >
                      post a listing
                    </Link>{" "}
                    in this category, or try a different tab above.
                  </p>
                </div>
              </section>
            );
          }

          return locationGroups.map(([locName, { slug: locSlug, listings }]) => (
            <section key={locName} className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#f0eeeb]">
                    <MapPin className="w-4 h-4 text-[#999]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-light text-[#1a1a1a]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {locName}
                    </h2>
                    <p className="text-xs text-[#bbb]">
                      {listings.length} listing{listings.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/search?category=${categorySlug}${locSlug ? `&location=${locSlug}` : ""}`}
                  className="text-sm font-medium text-[#1a1a1a] hover:text-[#666] flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {listings.slice(0, 4).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          ));
        })()}

        {/* ── CTA Banner ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden p-8 md:p-12 text-white text-center">
          {heroImage ? (
            <>
              <Image src={heroImage} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-[#2C2826]/65" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#2C2826]" />
          )}
          <div className="relative">
            <h3
              className="text-2xl md:text-3xl font-light mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to list your {categoryName.toLowerCase().replace(/ies$/, "y").replace(/s$/, "")}?
            </h3>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Reach thousands of buyers across Cyprus. AI-powered pricing
              suggestions help you get the best deal.
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {postLabel}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
