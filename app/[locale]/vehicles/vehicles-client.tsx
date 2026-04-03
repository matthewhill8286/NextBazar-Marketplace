"use client";

import {
  ArrowRight,
  BarChart3,
  Bike,
  Car,
  Clock,
  Cog,
  type LucideIcon,
  MapPin,
  Plus,
  Search,
  Store,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { Link } from "@/i18n/navigation";
import type {
  ListingCardRow,
  Subcategory,
} from "@/lib/supabase/supabase.types";
import VehicleFilters, {
  applyVehicleFilters,
  type VehicleFilterState,
} from "./vehicle-filters";
import VehicleComparePanel from "./vehicle-compare-panel";
import PriceInsights, { getDealRating, DEAL_CONFIG } from "./price-insights";

// ─── Tab config ─────────────────────────────────────────────────────────────

type TabConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  subcategorySlugs: string[];
  filterByDealer?: boolean;
  /** Show vehicle-specific features (filters, compare, insights) */
  showVehicleFeatures?: boolean;
};

const TABS: TabConfig[] = [
  {
    key: "cars",
    label: "Cars",
    icon: Car,
    description:
      "Browse new and used cars from private sellers and certified Pro Sellers — inspected, priced fairly, and ready to drive.",
    subcategorySlugs: ["cars"],
    showVehicleFeatures: true,
  },
  {
    key: "motorcycles",
    label: "Motorcycles & More",
    icon: Bike,
    description:
      "Explore motorcycles, trucks, vans, boats, and bicycles from sellers across Cyprus.",
    subcategorySlugs: ["motorcycles", "trucks-vans", "boats", "bicycles"],
    showVehicleFeatures: true,
  },
  {
    key: "parts",
    label: "Parts & Accessories",
    icon: Cog,
    description:
      "Find quality auto parts, accessories, tyres, and aftermarket upgrades for all vehicle types.",
    subcategorySlugs: ["parts-accessories"],
    showVehicleFeatures: false,
  },
  {
    key: "dealers",
    label: "Pro Seller Showrooms",
    icon: Store,
    description:
      "Shop directly from trusted Pro Sellers — browse their full inventory, compare prices, and get exclusive deals.",
    subcategorySlugs: [],
    filterByDealer: true,
    showVehicleFeatures: true,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function filterListings(
  listings: ListingCardRow[],
  tabConfig: TabConfig | undefined,
  subcategories: Subcategory[],
): ListingCardRow[] {
  if (!tabConfig) return listings;

  if (tabConfig.filterByDealer) {
    return listings.filter(
      (l) =>
        l.profiles &&
        typeof l.profiles === "object" &&
        "is_pro_seller" in l.profiles &&
        (l.profiles as { is_pro_seller?: boolean }).is_pro_seller,
    );
  }

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

// ─── Props ──────────────────────────────────────────────────────────────────

type Props = {
  category: { id: string; name: string; slug: string; icon: string | null };
  subcategories: Subcategory[];
  featuredListings: ListingCardRow[];
  recentListings: ListingCardRow[];
};

const EMPTY_FILTERS: VehicleFilterState = {
  search: "",
  make: "",
  model: "",
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  mileageMax: "",
  fuelType: "",
  transmission: "",
  bodyType: "",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function VehiclesClient({
  category,
  subcategories,
  featuredListings,
  recentListings,
}: Props) {
  const t = useTranslations("categoryLanding");
  const [activeTab, setActiveTab] = useState(TABS[0]?.key ?? "");
  const [filters, setFilters] = useState<VehicleFilterState>(EMPTY_FILTERS);

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab);
  const showVehicleFeatures = activeTabConfig?.showVehicleFeatures ?? false;

  const tabSubcategories = subcategories.filter((sc) =>
    activeTabConfig?.subcategorySlugs.includes(sc.slug),
  );

  // Filter by tab first
  const tabFeatured = useMemo(
    () => filterListings(featuredListings, activeTabConfig, subcategories),
    [featuredListings, activeTabConfig, subcategories],
  );
  const tabRecent = useMemo(
    () => filterListings(recentListings, activeTabConfig, subcategories),
    [recentListings, activeTabConfig, subcategories],
  );

  // Then apply vehicle-specific filters
  const displayFeatured = useMemo(
    () => (showVehicleFeatures ? applyVehicleFilters(tabFeatured, filters) : tabFeatured),
    [tabFeatured, filters, showVehicleFeatures],
  );
  const displayRecent = useMemo(
    () => (showVehicleFeatures ? applyVehicleFilters(tabRecent, filters) : tabRecent),
    [tabRecent, filters, showVehicleFeatures],
  );

  // All visible listings (for filters, insights, comparison)
  const allTabListings = useMemo(() => {
    const combined = [...tabFeatured, ...tabRecent];
    const uniqueMap = new Map(combined.map((l) => [l.id, l]));
    return Array.from(uniqueMap.values());
  }, [tabFeatured, tabRecent]);

  const allDisplayListings = useMemo(() => {
    const combined = [...displayFeatured, ...displayRecent];
    const uniqueMap = new Map(combined.map((l) => [l.id, l]));
    return Array.from(uniqueMap.values());
  }, [displayFeatured, displayRecent]);

  // Stats
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const tabStats = useMemo(() => {
    const unique = allDisplayListings;
    return {
      total: unique.length,
      newThisWeek: unique.filter(
        (l) => now - new Date(l.created_at).getTime() < oneWeekMs,
      ).length,
      avgPrice:
        unique.length > 0
          ? Math.round(
              unique.reduce((sum, l) => sum + (l.price ?? 0), 0) / unique.length,
            )
          : 0,
    };
  }, [allDisplayListings, now, oneWeekMs]);

  // Reset filters on tab change
  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
      setFilters(EMPTY_FILTERS);
    },
    [],
  );

  const heroImage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/heroes/vehicle-hero.jpg`;
  const categorySlug = category.slug;

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <Image src={heroImage} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-[#2C2826]/65" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-white/40 mb-4">
              {t("listingsAvailable")}
            </p>
            <h1
              className="text-3xl md:text-5xl font-light mb-4 leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Buy & Sell Cars in Cyprus
            </h1>
            <p className="text-white/50 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
              From brand-new models to quality used cars and trusted dealer
              showrooms — find your next ride or reach thousands of buyers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/search?category=${categorySlug}`}
                className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-white/90 transition-colors"
              >
                <Search className="w-4 h-4" />
                {t("browseAll", { categoryName: "Vehicles" })}
              </Link>
              <Link
                href="/post"
                className="inline-flex items-center gap-2 border border-white/20 text-white text-xs font-medium tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                List a Vehicle
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
              <BarChart3 className="w-4 h-4 text-[#8a8280]" />
              <span className="font-semibold text-[#1a1a1a]">
                {tabStats.total.toLocaleString()}
              </span>{" "}
              {t("listingsAvailable")}
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
            <div className="flex items-center gap-2 text-[#666]">
              <Clock className="w-4 h-4 text-[#8a8280]" />
              <span className="font-semibold text-[#1a1a1a]">
                {tabStats.newThisWeek.toLocaleString()}
              </span>{" "}
              {t("newThisWeek")}
            </div>
            {tabStats.avgPrice > 0 && (
              <>
                <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
                <div className="flex items-center gap-2 text-[#666]">
                  <TrendingUp className="w-4 h-4 text-[#8a8280]" />
                  {t("avgPrice")}{" "}
                  <span className="font-semibold text-[#1a1a1a]">
                    €{tabStats.avgPrice.toLocaleString()}
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
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
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
            <p className="text-[#6b6560] text-sm mb-4">
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
                    <ArrowRight className="w-3 h-3 text-[#8a8280]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Vehicle Filters (new) ──────────────────────────────────── */}
        {showVehicleFeatures && (
          <VehicleFilters
            listings={allTabListings}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={allDisplayListings.length}
          />
        )}

        {/* ── Vehicle Compare Panel (new) ────────────────────────────── */}
        {showVehicleFeatures && (
          <VehicleComparePanel
            enrichedItems={allTabListings as unknown as Record<string, unknown>[]}
          />
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
                  {t("featured", { categoryName: "Vehicles" })}
                </h2>
                <p className="text-sm text-[#8a8280] mt-0.5">{t("promoted")}</p>
              </div>
              <Link
                href={`/search?category=${categorySlug}&sort=promoted`}
                className="text-sm font-medium text-[#1a1a1a] hover:text-[#666] flex items-center gap-1"
              >
                {t("viewAll")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayFeatured.slice(0, 4).map((listing) => {
                const deal = showVehicleFeatures
                  ? getDealRating(listing, allTabListings)
                  : null;
                return (
                  <div key={listing.id} className="relative">
                    {deal && DEAL_CONFIG[deal] && (() => {
                      const DealIcon = DEAL_CONFIG[deal].icon;
                      return (
                        <div
                          className={`absolute top-3 left-3 z-20 ${DEAL_CONFIG[deal].bg} ${DEAL_CONFIG[deal].color} text-[9px] font-semibold px-2.5 py-1 tracking-[0.15em] uppercase flex items-center gap-1`}
                        >
                          <DealIcon className="w-3 h-3" />
                          {DEAL_CONFIG[deal].label}
                        </div>
                      );
                    })()}
                    <ListingCard listing={listing} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Price Insights (new) ───────────────────────────────────── */}
        {showVehicleFeatures && allDisplayListings.length > 0 && (
          <PriceInsights listings={allDisplayListings} />
        )}

        {/* ── Listings by Location ─────────────────────────────────────── */}
        {(() => {
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

          const locationGroups = Array.from(byLocation.entries()).sort(
            (a, b) => b[1].listings.length - a[1].listings.length,
          );

          if (locationGroups.length === 0) {
            return (
              <section className="mb-12">
                <div className="text-center py-16 text-[#8a8280]">
                  <p className="text-lg font-medium mb-1">
                    {t("noListings", {
                      category: activeTabConfig?.label.toLowerCase() ?? "",
                    })}
                  </p>
                  <p className="text-sm">
                    {t("beFirst")}{" "}
                    <Link
                      href="/post"
                      className="text-[#1a1a1a] font-medium hover:underline"
                    >
                      {t("postAListing")}
                    </Link>{" "}
                    {t("differentTab")}
                  </p>
                </div>
              </section>
            );
          }

          return locationGroups.map(
            ([locName, { slug: locSlug, listings }]) => (
              <section key={locName} className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#f0eeeb]">
                      <MapPin className="w-4 h-4 text-[#6b6560]" />
                    </div>
                    <div>
                      <h2
                        className="text-lg font-light text-[#1a1a1a]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {locName}
                      </h2>
                      <p className="text-xs text-[#8a8280]">
                        {t("locationListings", { count: listings.length })}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/search?category=${categorySlug}${locSlug ? `&location=${locSlug}` : ""}`}
                    className="text-sm font-medium text-[#1a1a1a] hover:text-[#666] flex items-center gap-1"
                  >
                    {t("viewAll")} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {listings.slice(0, 4).map((listing) => {
                    const deal = showVehicleFeatures
                      ? getDealRating(listing, allTabListings)
                      : null;
                    return (
                      <div key={listing.id} className="relative">
                        {deal && deal !== "fair" && DEAL_CONFIG[deal] && (() => {
                          const DealIcon = DEAL_CONFIG[deal].icon;
                          return (
                            <div
                              className={`absolute top-3 left-3 z-20 ${DEAL_CONFIG[deal].bg} ${DEAL_CONFIG[deal].color} text-[9px] font-semibold px-2.5 py-1 tracking-[0.15em] uppercase flex items-center gap-1`}
                            >
                              <DealIcon className="w-3 h-3" />
                              {DEAL_CONFIG[deal].label}
                            </div>
                          );
                        })()}
                        <ListingCard listing={listing} />
                      </div>
                    );
                  })}
                </div>
              </section>
            ),
          );
        })()}

        {/* ── CTA Banner ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden p-8 md:p-12 text-white text-center">
          <Image src={heroImage} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#2C2826]/65" />
          <div className="relative">
            <h3
              className="text-2xl md:text-3xl font-light mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("readyToList", { category: "vehicle" })}
            </h3>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              {t("readyDesc")}
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              List a Vehicle
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
