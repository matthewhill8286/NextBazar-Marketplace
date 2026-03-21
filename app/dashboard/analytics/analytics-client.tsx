"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  BarChart2,
  ExternalLink,
} from "lucide-react";

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

// Build last-N-days date labels
function buildDateRange(days: number): string[] {
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    labels.push(d.toISOString().split("T")[0]);
  }
  return labels;
}

// Simple sparkline SVG
function Sparkline({
  data,
  color = "#3b82f6",
}: {
  data: number[];
  color?: string;
}) {
  if (!data.length || Math.max(...data) === 0)
    return (
      <div className="h-10 flex items-center">
        <span className="text-xs text-gray-300">no data</span>
      </div>
    );
  const max = Math.max(...data);
  const w = 120;
  const h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4);
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Mini bar chart for a single listing detail
function MiniBarChart({
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
    <div className="flex items-end gap-0.5 h-20">
      {values.map((v, i) => (
        <div key={dates[i]} className="flex-1 flex items-end" title={`${dates[i]}: ${v}`}>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max(2, (v / max) * 76)}px`,
              background: color,
              opacity: v === 0 ? 0.15 : 1,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsClient({ listings, analytics }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    listings[0]?.id ?? null,
  );
  const [metric, setMetric] = useState<"views" | "favorites" | "messages">(
    "views",
  );

  const dates30 = buildDateRange(30);
  const dates7 = buildDateRange(7);

  // Index analytics by listing_id + date for fast lookups
  const analyticsMap = useMemo(() => {
    const map = new Map<string, Map<string, AnalyticsRow>>();
    for (const row of analytics) {
      if (!map.has(row.listing_id)) map.set(row.listing_id, new Map());
      map.get(row.listing_id)!.set(row.date, row);
    }
    return map;
  }, [analytics]);

  function getMetric(listingId: string, date: string, m: typeof metric) {
    return analyticsMap.get(listingId)?.get(date)?.[m] ?? 0;
  }

  function getSparkline(listingId: string) {
    return dates7.map((d) => getMetric(listingId, d, "views"));
  }

  // Total stats for selected listing
  const selectedListing = listings.find((l) => l.id === selectedId);
  const selectedSeries = dates30.map((d) =>
    selectedId ? getMetric(selectedId, d, metric) : 0,
  );
  const totalForPeriod = selectedSeries.reduce((a, b) => a + b, 0);
  const prev30 = buildDateRange(60).slice(0, 30);
  const prevTotal = prev30.reduce(
    (a, d) => a + (selectedId ? getMetric(selectedId, d, metric) : 0),
    0,
  );
  const pctChange =
    prevTotal > 0 ? Math.round(((totalForPeriod - prevTotal) / prevTotal) * 100) : null;

  const METRICS = [
    { key: "views" as const, label: "Views", icon: Eye, color: "#3b82f6", bg: "bg-blue-50", text: "text-blue-600" },
    { key: "favorites" as const, label: "Saves", icon: Heart, color: "#ec4899", bg: "bg-pink-50", text: "text-pink-600" },
    { key: "messages" as const, label: "Messages", icon: MessageCircle, color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600" },
  ];

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Track performance across all your listings.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No listings yet
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Post your first listing to start tracking performance.
          </p>
          <Link
            href="/post"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Post a Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          {/* Left — listing selector */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
              Your Listings
            </p>
            <div className="space-y-2">
              {listings.map((l) => {
                const spark = getSparkline(l.id);
                const isSelected = l.id === selectedId;
                return (
                  <button
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-200 bg-blue-50 ring-2 ring-blue-100"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                      {l.primary_image_url ? (
                        <Image
                          src={l.primary_image_url}
                          alt={l.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                          📦
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {l.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          {(l.view_count || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-gray-500">
                          <Heart className="w-3 h-3" />
                          {l.favorite_count || 0}
                        </span>
                      </div>
                    </div>

                    <Sparkline data={spark} color={isSelected ? "#3b82f6" : "#9ca3af"} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — detail chart */}
          {selectedListing && (
            <div className="space-y-4">
              {/* Listing header */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
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
                  <h2 className="font-semibold text-gray-900 truncate">
                    {selectedListing.title}
                  </h2>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                      selectedListing.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {selectedListing.status}
                  </span>
                </div>
                <Link
                  href={`/listing/${selectedListing.slug}`}
                  target="_blank"
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-3 gap-3">
                {METRICS.map((m) => {
                  const total = dates30.reduce(
                    (a, d) =>
                      a + (selectedId ? getMetric(selectedId, d, m.key) : 0),
                    0,
                  );
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
                      className={`p-4 rounded-xl border transition-all text-left ${
                        metric === m.key
                          ? `${m.bg} border-current ${m.text} ring-2 ring-current/20`
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className={`w-8 h-8 ${m.bg} rounded-lg flex items-center justify-center mb-2`}>
                        <m.icon className={`w-4 h-4 ${m.text}`} />
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {m.label} (30d)
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {allTime.toLocaleString()} all-time
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${activeMetric.text}`} />
                    <span className="text-sm font-semibold text-gray-900">
                      {activeMetric.label} — Last 30 days
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {pctChange !== null && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          pctChange >= 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {pctChange >= 0 ? "+" : ""}
                        {pctChange}% vs prev 30d
                      </span>
                    )}
                    <span className="text-xl font-bold text-gray-900">
                      {totalForPeriod.toLocaleString()}
                    </span>
                  </div>
                </div>

                <MiniBarChart
                  dates={dates30}
                  values={selectedSeries}
                  color={activeMetric.color}
                />

                {/* Date labels — first and last */}
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>
                    {new Date(dates30[0]).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Daily analytics are recorded when visitors view your listing. Data may
        lag by a few minutes.
      </p>
    </div>
  );
}
