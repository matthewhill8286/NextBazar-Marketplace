"use client";

import {
  BarChart2,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Listing = {
  id: string;
  title: string;
  slug: string;
  primary_image_url: string | null;
  view_count: number;
  favorite_count: number;
  status: string;
  created_at: string;
};

type AnalyticsRow = {
  listing_id: string;
  date: string;
  views: number;
  favorites: number;
  messages: number;
};

type Props = {
  listings: Listing[];
  analytics: AnalyticsRow[];
};

function buildDateRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

/** Distribute a total count evenly across N days, remainder on the last day */
function distributeEven(total: number, days: number): number[] {
  if (total === 0 || days === 0) return Array(days).fill(0);
  const perDay = Math.floor(total / days);
  const remainder = total - perDay * days;
  return Array(days)
    .fill(perDay)
    .map((v, i) => (i === days - 1 ? v + remainder : v));
}

function Sparkline({
  data,
  color = "#3b82f6",
}: {
  data: number[];
  color?: string;
}) {
  const max = Math.max(...data, 1);
  const w = 96;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 4);
    return `${x},${y}`;
  });
  const fill = `M ${pts.join(" L ")} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <path d={fill} fill={color} opacity="0.12" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarChart({
  dates,
  values,
  color,
}: {
  dates: string[];
  values: number[];
  color: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-px h-24">
      {values.map((v, i) => (
        <div
          key={dates[i]}
          className="flex-1 flex flex-col items-center justify-end group relative"
          title={`${new Date(dates[i]).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${v}`}
        >
          <div
            className="w-full transition-all"
            style={{
              height: `${Math.max(2, (v / max) * 88)}px`,
              background: color,
              opacity: v === 0 ? 0.12 : 0.85,
            }}
          />
        </div>
      ))}
    </div>
  );
}

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
];

const METRICS = [
  {
    key: "views" as const,
    label: "Views",
    icon: Eye,
    color: "#8E7A6B",
    bg: "bg-[#f0eeeb]",
    text: "text-[#8E7A6B]",
    border: "border-[#e8e6e3]",
  },
  {
    key: "favorites" as const,
    label: "Saves",
    icon: Heart,
    color: "#ec4899",
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-200",
  },
  {
    key: "messages" as const,
    label: "Messages",
    icon: MessageCircle,
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },
];

export default function AnalyticsClient({ listings, analytics }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    listings[0]?.id ?? null,
  );
  const [metric, setMetric] = useState<"views" | "favorites" | "messages">(
    "views",
  );
  const [rangeDays, setRangeDays] = useState(30);

  const dates = useMemo(() => buildDateRange(rangeDays), [rangeDays]);

  // Index real analytics rows by listing_id → date
  const analyticsMap = useMemo(() => {
    const map = new Map<string, Map<string, AnalyticsRow>>();
    for (const row of analytics) {
      if (!map.has(row.listing_id)) map.set(row.listing_id, new Map());
      map.get(row.listing_id)!.set(row.date, row);
    }
    return map;
  }, [analytics]);

  /** Get a value for a listing/date/metric. Falls back to 0 — real data only. */
  function getValue(listingId: string, date: string, m: typeof metric): number {
    return analyticsMap.get(listingId)?.get(date)?.[m] ?? 0;
  }

  /** True if this listing has at least one real analytics row */
  function hasRealData(listingId: string): boolean {
    return (analyticsMap.get(listingId)?.size ?? 0) > 0;
  }

  /**
   * Build a series for the selected range.
   * If no analytics rows exist for this listing yet, synthesise a plausible
   * distribution from the all-time view_count / favorite_count.
   */
  function getSeries(listingId: string, m: typeof metric): number[] {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return Array(rangeDays).fill(0);

    const real = dates.map((d) => getValue(listingId, d, m));
    const realTotal = real.reduce((a, b) => a + b, 0);

    // If real data covers meaningful values, use it
    if (realTotal > 0) return real;

    // Synthetic fallback: spread all-time count evenly
    const allTime =
      m === "views"
        ? listing.view_count
        : m === "favorites"
          ? listing.favorite_count
          : 0;
    if (allTime === 0) return Array(rangeDays).fill(0);

    // Only distribute across days the listing has existed
    const listingAge = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(listing.created_at).getTime()) / 86400000,
      ),
    );
    const activeDays = Math.min(rangeDays, listingAge);
    const distributed = distributeEven(allTime, activeDays);
    // Pad the front with zeros if listing is younger than the range
    return [...Array(rangeDays - activeDays).fill(0), ...distributed];
  }

  function getSparkline(listingId: string): number[] {
    return getSeries(listingId, "views").slice(-7);
  }

  const selectedListing = listings.find((l) => l.id === selectedId);
  const selectedSeries = selectedId
    ? getSeries(selectedId, metric)
    : Array(rangeDays).fill(0);
  const totalForPeriod = selectedSeries.reduce((a, b) => a + b, 0);

  // Compare to the previous same-length period
  const prevDates = buildDateRange(rangeDays * 2).slice(0, rangeDays);
  const prevTotal = selectedId
    ? prevDates
        .map((d) => getValue(selectedId, d, metric))
        .reduce((a, b) => a + b, 0)
    : 0;
  const pctChange =
    prevTotal > 0
      ? Math.round(((totalForPeriod - prevTotal) / prevTotal) * 100)
      : null;

  const isSynthetic = selectedId ? !hasRealData(selectedId) : false;

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  // Totals across ALL listings for the summary row
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalFavs = listings.reduce((s, l) => s + l.favorite_count, 0);
  const totalActive = listings.filter((l) => l.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Analytics
          </h1>
          <p className="text-sm text-[#999] mt-0.5">
            Track performance across all your listings.
          </p>
        </div>
        <Link
          href="/post"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#8E7A6B] text-white text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#7A6657] transition-colors"
        >
          + New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white border border-[#e8e6e3] p-16 text-center">
          <BarChart2 className="w-12 h-12 text-[#ccc] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">
            No listings yet
          </h3>
          <p className="text-[#999] text-sm mb-6">
            Post your first listing to start tracking performance.
          </p>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8E7A6B] text-white text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#7A6657] transition-colors"
          >
            Post a Listing
          </Link>
        </div>
      ) : (
        <>
          {/* Summary row — sticky at top */}
          <div className="grid grid-cols-3 gap-3 sticky top-0 z-10 bg-[#faf9f7] pb-2 -mx-1 px-1">
            {[
              {
                label: "Active Listings",
                value: totalActive,
                icon: BarChart2,
                color: "text-[#8E7A6B]",
                bg: "bg-[#f0eeeb]",
              },
              {
                label: "Total Views",
                value: totalViews,
                icon: Eye,
                color: "text-[#8E7A6B]",
                bg: "bg-[#f0eeeb]",
              },
              {
                label: "Total Saves",
                value: totalFavs,
                icon: Heart,
                color: "text-pink-600",
                bg: "bg-pink-50",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 ${s.bg} flex items-center justify-center shrink-0`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1a1a1a]">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#999]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
            {/* Left — listing list (scrollable) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#999] uppercase tracking-wide px-1">
                Your Listings
              </p>
              <div className="space-y-1.5">
                {listings.map((l) => {
                  const spark = getSparkline(l.id);
                  const sparkTotal = spark.reduce((a, b) => a + b, 0);
                  const isSelected = l.id === selectedId;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedId(l.id)}
                      className={`w-full flex items-center gap-3 p-3 border text-left transition-all ${
                        isSelected
                          ? "border-[#8E7A6B]/30 bg-[#f0eeeb] ring-2 ring-[#8E7A6B]/10"
                          : "border-[#e8e6e3] bg-white hover:border-[#e8e6e3] hover:bg-[#faf9f7]/80"
                      }`}
                    >
                      <div className="w-11 h-11 overflow-hidden bg-[#f0eeeb] shrink-0 relative">
                        {l.primary_image_url ? (
                          <Image
                            src={l.primary_image_url}
                            alt={l.title}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#ccc] text-lg">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate">
                          {l.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5 text-xs text-[#999]">
                            <Eye className="w-3 h-3" />
                            {(l.view_count || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs text-[#999]">
                            <Heart className="w-3 h-3" />
                            {l.favorite_count || 0}
                          </span>
                        </div>
                      </div>
                      <Sparkline
                        data={
                          sparkTotal > 0
                            ? spark
                            : distributeEven(l.view_count, 7)
                        }
                        color={isSelected ? "#8E7A6B" : "#9ca3af"}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right — detail (sticky so it stays visible while scrolling listings) */}
            {selectedListing && (
              <div className="space-y-4 sticky top-[100px]">
                {/* Listing header */}
                <div className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3">
                  <div className="w-14 h-14 overflow-hidden bg-[#f0eeeb] shrink-0 relative">
                    {selectedListing.primary_image_url ? (
                      <Image
                        src={selectedListing.primary_image_url}
                        alt={selectedListing.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[#1a1a1a] truncate">
                      {selectedListing.title}
                    </h2>
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${selectedListing.status === "active" ? "bg-green-50 text-green-700" : "bg-[#f0eeeb] text-[#666]"}`}
                    >
                      {selectedListing.status}
                    </span>
                  </div>
                  <Link
                    href={`/listing/${selectedListing.slug}`}
                    target="_blank"
                    className="p-2 text-[#bbb] hover:text-[#8E7A6B] hover:bg-[#f0eeeb] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-3">
                  {METRICS.map((m) => {
                    const series = getSeries(selectedListing.id, m.key);
                    const total = series.reduce((a, b) => a + b, 0);
                    const allTime =
                      m.key === "views"
                        ? selectedListing.view_count
                        : m.key === "favorites"
                          ? selectedListing.favorite_count
                          : total;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setMetric(m.key)}
                        className={`p-4 border transition-all text-left ${metric === m.key ? `${m.bg} ${m.border} ring-2 ring-current/10` : "bg-white border-[#e8e6e3] hover:border-[#e8e6e3]"}`}
                      >
                        <div
                          className={`w-8 h-8 ${m.bg} flex items-center justify-center mb-2`}
                        >
                          <m.icon className={`w-4 h-4 ${m.text}`} />
                        </div>
                        <div className="text-2xl font-bold text-[#1a1a1a]">
                          {total.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#999] mt-0.5">
                          {m.label} ({rangeDays}d)
                        </div>
                        <div className="text-xs text-[#bbb] mt-0.5">
                          {allTime.toLocaleString()} all-time
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Chart */}
                <div className="bg-white border border-[#e8e6e3] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${activeMetric.text}`} />
                      <span className="text-sm font-semibold text-[#1a1a1a]">
                        {activeMetric.label}
                      </span>
                      {isSynthetic && (
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
                          estimated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {pctChange !== null && !isSynthetic && (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${pctChange >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                        >
                          {pctChange >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {pctChange >= 0 ? "+" : ""}
                          {pctChange}%
                        </span>
                      )}
                      <span className="text-xl font-bold text-[#1a1a1a]">
                        {totalForPeriod.toLocaleString()}
                      </span>
                      {/* Range picker */}
                      <div className="flex gap-0.5 bg-[#f0eeeb] p-0.5">
                        {RANGES.map((r) => (
                          <button
                            key={r.days}
                            onClick={() => setRangeDays(r.days)}
                            className={`px-2.5 py-1 text-xs font-medium transition-colors ${rangeDays === r.days ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#999] hover:text-[#666]"}`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <BarChart
                    dates={dates}
                    values={selectedSeries}
                    color={activeMetric.color}
                  />

                  <div className="flex justify-between mt-2 text-xs text-[#bbb]">
                    <span>
                      {new Date(dates[0]).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span>Today</span>
                  </div>
                </div>

                {isSynthetic && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-4 py-2.5">
                    Estimated distribution based on total views — live
                    day-by-day tracking started today and will populate over
                    time.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
