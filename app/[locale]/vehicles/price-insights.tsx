"use client";

import {
  ArrowDown,
  ArrowUp,
  Minus,
  Sparkles,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { getAttr } from "@/app/helpers/get-attr";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

type MakeStats = {
  make: string;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
};

function computeMakeStats(listings: ListingCardRow[]): MakeStats[] {
  const byMake = new Map<string, number[]>();

  for (const l of listings) {
    const make = getAttr(l, "make");
    if (!make || l.price === null) continue;
    if (!byMake.has(make)) byMake.set(make, []);
    byMake.get(make)!.push(l.price);
  }

  const stats: MakeStats[] = [];
  for (const [make, prices] of byMake.entries()) {
    if (prices.length < 1) continue;
    prices.sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const mid = Math.floor(prices.length / 2);
    const median =
      prices.length % 2 === 0
        ? Math.round((prices[mid - 1] + prices[mid]) / 2)
        : prices[mid];

    stats.push({
      make,
      count: prices.length,
      avgPrice: Math.round(sum / prices.length),
      minPrice: prices[0],
      maxPrice: prices[prices.length - 1],
      medianPrice: median,
    });
  }

  return stats.sort((a, b) => b.count - a.count);
}

// ─── Deal scoring ───────────────────────────────────────────────────────────

export type DealRating = "great" | "good" | "fair" | "above";

export function getDealRating(
  listing: ListingCardRow,
  allListings: ListingCardRow[],
): DealRating | null {
  if (listing.price === null) return null;
  const make = getAttr(listing, "make");
  if (!make) return null;

  // Gather prices for same make
  const sameMakePrices: number[] = [];
  for (const l of allListings) {
    if (l.price !== null && getAttr(l, "make") === make) {
      sameMakePrices.push(l.price);
    }
  }

  if (sameMakePrices.length < 2) return null;

  const avg = sameMakePrices.reduce((a, b) => a + b, 0) / sameMakePrices.length;
  const ratio = listing.price / avg;

  if (ratio <= 0.8) return "great";
  if (ratio <= 0.92) return "good";
  if (ratio <= 1.08) return "fair";
  return "above";
}

export const DEAL_CONFIG: Record<
  DealRating,
  { label: string; color: string; bg: string; icon: typeof ArrowDown }
> = {
  great: {
    label: "Great Deal",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    icon: ArrowDown,
  },
  good: {
    label: "Good Deal",
    color: "text-green-700",
    bg: "bg-green-50",
    icon: TrendingDown,
  },
  fair: {
    label: "Fair Price",
    color: "text-[#8a8280]",
    bg: "bg-[#faf9f7]",
    icon: Minus,
  },
  above: {
    label: "Above Avg",
    color: "text-amber-700",
    bg: "bg-amber-50",
    icon: TrendingUp,
  },
};

// ─── Price Distribution Bar ─────────────────────────────────────────────────

function PriceBar({
  min,
  max,
  avg,
  median,
}: {
  min: number;
  max: number;
  avg: number;
  median: number;
}) {
  const range = max - min || 1;
  const avgPos = ((avg - min) / range) * 100;
  const medPos = ((median - min) / range) * 100;

  return (
    <div className="relative h-2 bg-[#e8e6e3] w-full mt-2 mb-1">
      {/* Gradient fill */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 via-amber-100 to-rose-200 opacity-60" />
      {/* Average marker */}
      <div
        className="absolute top-0 w-0.5 h-full bg-[#1a1a1a]"
        style={{ left: `${Math.min(Math.max(avgPos, 2), 98)}%` }}
        title={`Avg: €${avg.toLocaleString()}`}
      />
      {/* Median marker */}
      <div
        className="absolute top-0 w-0.5 h-full bg-[#8E7A6B]"
        style={{ left: `${Math.min(Math.max(medPos, 2), 98)}%` }}
        title={`Median: €${median.toLocaleString()}`}
      />
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

type Props = {
  listings: ListingCardRow[];
};

export default function PriceInsights({ listings }: Props) {
  const makeStats = useMemo(() => computeMakeStats(listings), [listings]);

  // Overall stats
  const overallStats = useMemo(() => {
    const priced = listings.filter((l) => l.price !== null);
    if (priced.length === 0) return null;

    const prices = priced.map((l) => l.price!).sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    const mid = Math.floor(prices.length / 2);
    const median =
      prices.length % 2 === 0
        ? Math.round((prices[mid - 1] + prices[mid]) / 2)
        : prices[mid];

    const greatDeals = listings.filter(
      (l) => getDealRating(l, listings) === "great",
    ).length;
    const goodDeals = listings.filter(
      (l) => getDealRating(l, listings) === "good",
    ).length;

    return {
      avg,
      median,
      min: prices[0],
      max: prices[prices.length - 1],
      total: priced.length,
      greatDeals,
      goodDeals,
    };
  }, [listings]);

  if (!overallStats || makeStats.length === 0) return null;

  const topMakes = makeStats.slice(0, 6);

  return (
    <section className="mb-10">
      <p className="text-xs text-[#8a8280] mb-5">
        Market overview based on {overallStats.total} priced listings
      </p>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[#e8e6e3] p-4">
          <p className="text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1">
            Average Price
          </p>
          <p
            className="text-xl font-semibold text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            €{overallStats.avg.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#e8e6e3] p-4">
          <p className="text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1">
            Median Price
          </p>
          <p
            className="text-xl font-semibold text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            €{overallStats.median.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#e8e6e3] p-4">
          <p className="text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase mb-1">
            Price Range
          </p>
          <p className="text-sm font-medium text-[#1a1a1a]">
            €{overallStats.min.toLocaleString()} — €
            {overallStats.max.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-[#e8e6e3] p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <p className="text-[10px] font-medium text-[#8a8280] tracking-[0.15em] uppercase">
              Deals Found
            </p>
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">
            <span className="text-emerald-700">
              {overallStats.greatDeals} great
            </span>
            {" · "}
            <span className="text-green-700">
              {overallStats.goodDeals} good
            </span>
          </p>
        </div>
      </div>

      {/* Price by make */}
      {topMakes.length > 0 && (
        <div className="bg-white border border-[#e8e6e3]">
          <div className="p-4 border-b border-[#e8e6e3]">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#8a8280]" />
              <h3 className="text-sm font-medium text-[#1a1a1a]">
                Average Price by Make
              </h3>
            </div>
          </div>
          <div className="divide-y divide-[#f0eeeb]">
            {topMakes.map((stat) => (
              <div
                key={stat.make}
                className="px-4 py-3 flex items-center gap-4"
              >
                <div className="w-28 shrink-0">
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {stat.make}
                  </p>
                  <p className="text-[10px] text-[#8a8280]">
                    {stat.count} {stat.count === 1 ? "listing" : "listings"}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <PriceBar
                    min={stat.minPrice}
                    max={stat.maxPrice}
                    avg={stat.avgPrice}
                    median={stat.medianPrice}
                  />
                  <div className="flex justify-between text-[10px] text-[#8a8280]">
                    <span>€{stat.minPrice.toLocaleString()}</span>
                    <span>€{stat.maxPrice.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 w-24">
                  <p
                    className="text-sm font-semibold text-[#1a1a1a]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    €{stat.avgPrice.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#8a8280]">avg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
