"use client";

import {
  ArrowRight,
  BarChart3,
  Clock,
  type LucideIcon,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getCategoryConfig } from "@/app/components/category-icon";
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

type CategoryStats = {
  total: number;
  newThisWeek: number;
  avgPrice: number;
};

type Props = {
  categorySlug: string;
  categoryName: string;
  headline: string;
  subheadline: string;
  tabs: TabConfig[];
  stats: CategoryStats;
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
        "is_dealer" in l.profiles &&
        (l.profiles as { is_dealer?: boolean }).is_dealer === true,
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
  stats,
  subcategories,
  featuredListings,
  recentListings,
  currency = "€",
  postLabel = "Post a Listing",
  heroImage,
}: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "");
  const { gradient, accent } = getCategoryConfig(categorySlug);

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

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        {/* Background: image or gradient */}
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt=""
              fill
              className="object-cover"
              priority
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/50" />
            {/* Gradient tint overlay */}
            <div
              className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-40`}
            />
          </>
        ) : (
          <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
        )}

        {/* Dot mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute -top-40 -left-40 w-125 h-125 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: accent }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accent }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <TrendingUp className="w-3.5 h-3.5" />
              {stats.total.toLocaleString()} listings available
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-[1.1] drop-shadow-sm">
              {headline}
            </h1>
            <p className="text-white/85 text-lg md:text-xl mb-8 max-w-2xl leading-relaxed drop-shadow-sm">
              {subheadline}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/search?category=${categorySlug}`}
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-black/10"
              >
                <Search className="w-4 h-4" />
                Browse All {categoryName}
              </Link>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {postLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {stats.total.toLocaleString()}
              </span>{" "}
              listings available
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {stats.newThisWeek.toLocaleString()}
              </span>{" "}
              new this week
            </div>
            {stats.avgPrice > 0 && (
              <>
                <div className="hidden sm:block w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  avg price{" "}
                  <span className="font-semibold text-gray-900">
                    {currency}
                    {stats.avgPrice.toLocaleString()}
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
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm shadow-gray-900/10"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
            <p className="text-gray-500 text-sm mb-4">
              {activeTabConfig.description}
            </p>
            {tabSubcategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tabSubcategories.map((sc) => (
                  <Link
                    key={sc.id}
                    href={`/search?category=${categorySlug}&subcategory=${sc.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-150 hover:bg-gray-100 hover:border-gray-200 transition-colors"
                  >
                    {sc.name}
                    <ArrowRight className="w-3 h-3 text-gray-400" />
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
                <h2 className="text-xl font-bold text-gray-900">
                  Featured {categoryName}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Promoted listings from verified sellers
                </p>
              </div>
              <Link
                href={`/search?category=${categorySlug}&sort=promoted`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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

        {/* ── Recent Listings ──────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recently Added
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                The latest {categoryName.toLowerCase()} listings
              </p>
            </div>
            <Link
              href={`/search?category=${categorySlug}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayRecent.slice(0, 8).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {displayRecent.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium mb-1">
                No {activeTabConfig?.label.toLowerCase() ?? ""} listings yet
              </p>
              <p className="text-sm">
                Be the first to{" "}
                <Link href="/post" className="text-indigo-600 hover:underline">
                  post a listing
                </Link>{" "}
                in this category, or try a different tab above.
              </p>
            </div>
          )}
        </section>

        {/* ── CTA Banner ──────────────────────────────────────────────── */}
        <section className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-white text-center">
          {heroImage ? (
            <>
              <Image src={heroImage} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/55" />
              <div
                className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-30`}
              />
            </>
          ) : (
            <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
          )}
          <div className="relative">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to list your {categoryName.toLowerCase().replace(/s$/, "")}?
            </h3>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Reach thousands of buyers across Cyprus. AI-powered pricing
              suggestions help you get the best deal.
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-black/10"
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
