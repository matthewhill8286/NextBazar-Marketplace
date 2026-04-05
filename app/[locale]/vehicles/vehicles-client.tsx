"use client";

import {
  Anchor,
  ArrowRight,
  BarChart3,
  Bike,
  Car,
  Check,
  Clock,
  Crown,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { ShopCard } from "@/app/[locale]/shops/shops-client";
import { Link } from "@/i18n/navigation";
import type { ShopCardRow } from "@/lib/supabase/queries";
import type {
  ListingCardRow,
  Subcategory,
} from "@/lib/supabase/supabase.types";
import VehicleFilters, {
  applyVehicleFilters,
  type VehicleFilterState,
} from "./vehicle-filters";
import PriceInsights, { getDealRating, DEAL_CONFIG } from "./price-insights";

// ─── Tab config ─────────────────────────────────────────────────────────────

type TabConfig = {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  subcategorySlugs: string[];
  filterByDealer?: boolean;
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
    label: "Motorcycles",
    icon: Bike,
    description:
      "Explore motorcycles and scooters from sellers across Cyprus — sport bikes, cruisers, commuters, and more.",
    subcategorySlugs: ["motorcycles", "bicycles"],
    showVehicleFeatures: true,
  },
  {
    key: "vans-trucks",
    label: "Vans & Trucks",
    icon: Truck,
    description:
      "Find vans, trucks, and commercial vehicles for work or business — from panel vans to heavy-duty trucks.",
    subcategorySlugs: ["trucks-vans"],
    showVehicleFeatures: true,
  },
  {
    key: "boats",
    label: "Boats",
    icon: Anchor,
    description:
      "Discover boats, yachts, jet skis, and marine vessels from private sellers and brokers across Cyprus.",
    subcategorySlugs: ["boats"],
    showVehicleFeatures: true,
  },
  {
    key: "dealers",
    label: "Pro Seller Showrooms",
    icon: Store,
    description:
      "Shop directly from trusted Pro Sellers — browse their full inventory, compare prices, and get exclusive deals.",
    subcategorySlugs: [],
    filterByDealer: true,
    showVehicleFeatures: false,
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
  categoryShops?: ShopCardRow[];
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
  categoryShops = [],
}: Props) {
  const t = useTranslations("categoryLanding");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState(TABS[0]?.key ?? "");
  const [filters, setFilters] = useState<VehicleFilterState>(EMPTY_FILTERS);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab);
  const showVehicleFeatures = activeTabConfig?.showVehicleFeatures ?? false;
  const isDealerTab = activeTabConfig?.filterByDealer ?? false;

  const tabSubcategories = subcategories.filter((sc) =>
    activeTabConfig?.subcategorySlugs.includes(sc.slug),
  );

  // Split shops by tier
  const businessShops = useMemo(
    () => categoryShops.filter((s) => s.plan_tier === "business"),
    [categoryShops],
  );
  const proShops = useMemo(
    () => categoryShops.filter((s) => s.plan_tier === "pro"),
    [categoryShops],
  );
  const topShops = useMemo(() => categoryShops.slice(0, 4), [categoryShops]);

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
    () =>
      showVehicleFeatures
        ? applyVehicleFilters(tabFeatured, filters)
        : tabFeatured,
    [tabFeatured, filters, showVehicleFeatures],
  );
  const displayRecent = useMemo(
    () =>
      showVehicleFeatures
        ? applyVehicleFilters(tabRecent, filters)
        : tabRecent,
    [tabRecent, filters, showVehicleFeatures],
  );

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

  // Stats — context-aware
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const tabStats = useMemo(() => {
    if (isDealerTab) {
      return {
        total: categoryShops.length,
        newThisWeek: categoryShops.filter(
          (s) => now - new Date(s.created_at).getTime() < oneWeekMs,
        ).length,
        avgPrice: 0,
        totalDealerListings: categoryShops.reduce(
          (sum, s) => sum + s.listing_count,
          0,
        ),
      };
    }
    const unique = allDisplayListings;
    return {
      total: unique.length,
      newThisWeek: unique.filter(
        (l) => now - new Date(l.created_at).getTime() < oneWeekMs,
      ).length,
      avgPrice:
        unique.length > 0
          ? Math.round(
              unique.reduce((sum, l) => sum + (l.price ?? 0), 0) /
                unique.length,
            )
          : 0,
      totalDealerListings: 0,
    };
  }, [allDisplayListings, isDealerTab, categoryShops, now, oneWeekMs]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setFilters(EMPTY_FILTERS);
  }, []);

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
              Buy &amp; Sell Vehicles in Cyprus
            </h1>
            <p className="text-white/50 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
              From brand-new models to quality used cars, motorcycles, vans, and
              boats — find your next ride or reach thousands of buyers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/post"
                className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                List a Vehicle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar (context-aware) ────────────────────────────────── */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
            {isDealerTab ? (
              <>
                <div className="flex items-center gap-2 text-[#666]">
                  <Store className="w-4 h-4 text-[#8a8280]" />
                  <span className="font-semibold text-[#1a1a1a]">
                    {tabStats.total}
                  </span>{" "}
                  verified showrooms
                </div>
                <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
                <div className="flex items-center gap-2 text-[#666]">
                  <BarChart3 className="w-4 h-4 text-[#8a8280]" />
                  <span className="font-semibold text-[#1a1a1a]">
                    {tabStats.totalDealerListings.toLocaleString()}
                  </span>{" "}
                  {t("listingsAvailable")}
                </div>
                <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
                <div className="flex items-center gap-2 text-[#666]">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-[#1a1a1a]">
                    {businessShops.length}
                  </span>{" "}
                  Business sellers
                </div>
                {tabStats.avgPrice > 0 && (
                  <>
                    <div className="hidden sm:block w-px h-4 bg-[#e8e6e3]" />
                    <div className="flex items-center gap-2 text-[#666]">
                      <TrendingUp className="w-4 h-4 text-[#8a8280]" />
                      {t("avgPrice")}{" "}
                      <span className="font-semibold text-[#1a1a1a]">
                        &euro;{tabStats.avgPrice.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
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
                        &euro;{tabStats.avgPrice.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
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

        {/* ── Active Tab Description ──────────────────────────────── */}
        {activeTabConfig && (
          <div className="mb-6">
            <p className="text-[#6b6560] text-sm">
              {activeTabConfig.description}
            </p>
          </div>
        )}

        {/* ── Vehicle Filters ────────────────────────────────────────── */}
        {showVehicleFeatures && !isDealerTab && (
          <VehicleFilters
            listings={allTabListings}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={allDisplayListings.length}
          />
        )}

        {/* ── Featured Pro Sellers strip (on listing tabs) ───────────── */}
        {!isDealerTab && topShops.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 bg-amber-50">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2
                    className="text-lg font-light text-[#1a1a1a]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Trusted Dealerships
                  </h2>
                  <p className="text-xs text-[#8a8280]">
                    Verified Pro Sellers with vehicle inventory
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTabChange("dealers")}
                className="text-sm font-medium text-[#1a1a1a] hover:text-[#8E7A6B] flex items-center gap-1 transition-colors"
              >
                View all showrooms <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {topShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug}`}
                  className="group flex items-center gap-3 p-3 bg-white border border-[#e8e6e3] hover:border-[#ccc] hover:shadow-sm transition-all"
                >
                  <div className="shrink-0 w-10 h-10 overflow-hidden bg-[#f0eeeb]">
                    {shop.logo_url ? (
                      <Image
                        src={shop.logo_url}
                        alt={shop.shop_name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8E7A6B] text-xs font-bold">
                        {shop.shop_name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#1a1a1a] truncate group-hover:text-[#8E7A6B] transition-colors">
                        {shop.shop_name}
                      </span>
                      {shop.plan_tier === "business" && (
                        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                      {shop.plan_tier === "pro" && (
                        <Shield className="w-3 h-3 text-[#666] shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#8a8280]">
                      {shop.listing_count} listings
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── DEALER TAB CONTENT ─────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {isDealerTab && (
          <>
            {/* Why buy from Pro Sellers? */}
            <section className="mb-10 p-6 md:p-8 bg-gradient-to-br from-[#faf9f7] to-[#f5f0eb] border border-[#e8e6e3]">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-[#8E7A6B]" />
                <h3 className="text-sm font-semibold text-[#1a1a1a] tracking-wide uppercase">
                  Why buy from Pro Sellers?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Verified Identity",
                    desc: "Every Pro Seller is identity-verified and vetted before joining.",
                  },
                  {
                    icon: Check,
                    title: "Quality Guaranteed",
                    desc: "Listings are reviewed for accuracy, photos, and fair pricing.",
                  },
                  {
                    icon: MessageCircle,
                    title: "Direct Messaging",
                    desc: "Chat directly with the dealership — fast responses guaranteed.",
                  },
                  {
                    icon: Shield,
                    title: "Buyer Protection",
                    desc: "Transactions with Pro Sellers include NextBazar buyer protection.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-white border border-[#e8e6e3]">
                      <item.icon className="w-4 h-4 text-[#8E7A6B]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#6b6560] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Business Tier Showrooms */}
            {businessShops.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex items-center justify-center w-8 h-8 bg-amber-50">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-light text-[#1a1a1a]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Business Showrooms
                    </h2>
                    <p className="text-xs text-[#8a8280]">
                      Premium dealerships with the largest inventories
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {businessShops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} locale={locale} />
                  ))}
                </div>
              </section>
            )}

            {/* Pro Tier Showrooms */}
            {proShops.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#f0eeeb]">
                    <Shield className="w-4 h-4 text-[#6b6560]" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-light text-[#1a1a1a]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Pro Showrooms
                    </h2>
                    <p className="text-xs text-[#8a8280]">
                      Verified professional sellers
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {proShops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} locale={locale} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {categoryShops.length === 0 && (
              <section className="mb-12">
                <div className="text-center py-16 text-[#8a8280]">
                  <div className="w-14 h-14 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-4">
                    <Store className="w-7 h-7 text-[#8E7A6B]" />
                  </div>
                  <p className="text-lg font-medium mb-1 text-[#1a1a1a]">
                    No showrooms yet
                  </p>
                  <p className="text-sm max-w-sm mx-auto">
                    Dealerships in this category will appear here.{" "}
                    <Link
                      href="/pricing"
                      className="text-[#1a1a1a] font-medium hover:underline"
                    >
                      Become a Pro Seller
                    </Link>{" "}
                    to get listed.
                  </p>
                </div>
              </section>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── LISTING TAB CONTENT ────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════ */}

        {/* Featured Listings */}
        {!isDealerTab && displayFeatured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-xl font-light text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t("featured", { categoryName: "Vehicles" })}
                </h2>
                <p className="text-sm text-[#8a8280] mt-0.5">
                  {t("promoted")}
                </p>
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
                    {deal &&
                      DEAL_CONFIG[deal] &&
                      (() => {
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

        {/* Listings by Location */}
        {!isDealerTab &&
          (() => {
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
                        category:
                          activeTabConfig?.label.toLowerCase() ?? "",
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
                          {t("locationListings", {
                            count: listings.length,
                          })}
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
                          {deal &&
                            deal !== "fair" &&
                            DEAL_CONFIG[deal] &&
                            (() => {
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

        {/* ── CTA Banner (context-aware) ─────────────────────────────── */}
        <section className="relative overflow-hidden p-8 md:p-12 text-white text-center">
          <Image src={heroImage} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#2C2826]/65" />
          <div className="relative">
            {isDealerTab ? (
              <>
                <h3
                  className="text-2xl md:text-3xl font-light mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Grow your dealership on NextBazar
                </h3>
                <p className="text-white/50 mb-8 max-w-lg mx-auto">
                  Join {categoryShops.length > 0 ? categoryShops.length : ""}{" "}
                  trusted sellers. Get a branded showroom, priority placement,
                  and reach thousands of buyers across Cyprus.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-white/90 transition-colors"
                  >
                    <Crown className="w-4 h-4" />
                    View Pro Seller Plans
                  </Link>
                  <Link
                    href="/post"
                    className="inline-flex items-center gap-2 border border-white/20 text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    List a Vehicle
                  </Link>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Floating Price Insights button (bottom-right) ────────────── */}
      {showVehicleFeatures && !isDealerTab && allDisplayListings.length > 0 && (
        <>
          <button
            onClick={() => setShowInsightsModal(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#2C2826] text-white pl-4 pr-5 py-3 shadow-lg hover:bg-[#1a1a1a] transition-colors group"
            title="Price Insights"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium tracking-wide uppercase">
              Price Insights
            </span>
          </button>

          {/* Price Insights Modal */}
          {showInsightsModal && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowInsightsModal(false);
              }}
            >
              <div className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
                <div className="sticky top-0 bg-white border-b border-[#e8e6e3] px-6 py-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#8E7A6B]" />
                    <h2
                      className="text-lg font-light text-[#1a1a1a]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Price Insights
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowInsightsModal(false)}
                    className="w-8 h-8 flex items-center justify-center text-[#8a8280] hover:text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <PriceInsights listings={allDisplayListings} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
