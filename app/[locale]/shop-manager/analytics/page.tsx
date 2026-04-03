"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronDown,
  DollarSign,
  Euro,
  Eye,
  Heart,
  MessageCircle,
  Package,
  Percent,
  TrendingUp,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useShopCMS } from "../shop-context";
import type { AnalyticsRow } from "../shop-context";
import type { ListingRow } from "../../dashboard/dealer/types";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type Period = "7d" | "30d" | "90d";
type MetricKey = "views" | "favorites" | "messages";

const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

const METRIC_CONFIG: {
  key: MetricKey;
  label: string;
  icon: typeof Eye;
  color: string;
  gradient: string;
  bgLight: string;
}[] = [
  {
    key: "views",
    label: "Views",
    icon: Eye,
    color: "#8E7A6B",
    gradient: "from-[#8E7A6B] to-[#b09e8f]",
    bgLight: "bg-[#f0eeeb]",
  },
  {
    key: "favorites",
    label: "Saves",
    icon: Heart,
    color: "#ec4899",
    gradient: "from-pink-500 to-pink-400",
    bgLight: "bg-pink-50",
  },
  {
    key: "messages",
    label: "Enquiries",
    icon: MessageCircle,
    color: "#10b981",
    gradient: "from-emerald-600 to-emerald-400",
    bgLight: "bg-emerald-50",
  },
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function buildDateRange(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function formatDate(dateStr: string, short = false): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: short ? "short" : "long",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Chart Components ─────────────────────────────────────────────────────── */

function AreaChart({
  dates,
  values,
  color,
  height = 200,
}: {
  dates: string[];
  values: number[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const w = 100; // percentage-based
  const h = height;
  const padding = 4;

  const points = values.map((v, i) => {
    const x = values.length <= 1 ? 50 : (i / (values.length - 1)) * w;
    const y = h - padding - (v / max) * (h - padding * 2);
    return { x, y, value: v, date: dates[i] };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setHovered(null)}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={h - padding - pct * (h - padding * 2)}
            x2={w}
            y2={h - padding - pct * (h - padding * 2)}
            stroke="#e8e6e3"
            strokeWidth="0.15"
            strokeDasharray="0.5,0.5"
          />
        ))}

        {/* Gradient fill */}
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive hover zones */}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={i === 0 ? 0 : (points[i - 1].x + p.x) / 2}
              y={0}
              width={
                i === 0
                  ? points.length > 1
                    ? (points[1].x - p.x) / 2 + p.x
                    : w
                  : i === points.length - 1
                    ? w - (points[i - 1].x + p.x) / 2
                    : (points[Math.min(i + 1, points.length - 1)].x - points[Math.max(i - 1, 0)].x) / 2
              }
              height={h}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              className="cursor-crosshair"
            />
            {hovered === i && (
              <>
                <line x1={p.x} y1={0} x2={p.x} y2={h} stroke={color} strokeWidth="0.15" strokeDasharray="0.3,0.3" />
                <circle cx={p.x} cy={p.y} r="0.8" fill="white" stroke={color} strokeWidth="0.3" />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && points[hovered] && (
        <div
          className="absolute pointer-events-none z-20 bg-[#1a1a1a] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg -translate-x-1/2 whitespace-nowrap"
          style={{
            left: `${points[hovered].x}%`,
            top: `${points[hovered].y - 14}px`,
          }}
        >
          <span className="font-semibold">{points[hovered].value.toLocaleString()}</span>
          <span className="text-white/60 ml-1.5">{formatDate(points[hovered].date, true)}</span>
        </div>
      )}

      {/* Y-axis labels */}
      <div className="absolute top-0 right-0 flex flex-col justify-between h-full py-1 text-[10px] text-[#8a8280] pointer-events-none">
        <span>{max.toLocaleString()}</span>
        <span>{Math.round(max / 2).toLocaleString()}</span>
        <span>0</span>
      </div>
    </div>
  );
}

function MiniBarChart({
  values,
  color,
  height = 48,
}: {
  values: number[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[1px]" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all duration-300"
          style={{
            height: `${Math.max(4, (v / max) * 100)}%`,
            backgroundColor: color,
            opacity: v === 0 ? 0.1 : 0.7 + (v / max) * 0.3,
          }}
        />
      ))}
    </div>
  );
}

function DonutChart({
  segments,
  size = 120,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} className="shrink-0">
      {segments
        .filter((s) => s.value > 0)
        .map((seg) => {
          const pct = seg.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -offset;
          offset += dashLength;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={14}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90, ${size / 2}, ${size / 2})`}
              className="transition-all duration-500"
            />
          );
        })}
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-lg font-bold"
        fill="#1a1a1a"
      >
        {total}
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-[9px]"
        fill="#8a8280"
      >
        listings
      </text>
    </svg>
  );
}

function Sparkline({
  data,
  color = "#8E7A6B",
  width = 80,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - (v / max) * (height - 4);
    return `${x},${y}`;
  });
  const fill = `M ${pts.join(" L ")} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <path d={fill} fill={color} opacity="0.12" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export default function ShopAnalyticsPage() {
  const { listings, analytics, offers } = useShopCMS();
  const [period, setPeriod] = useState<Period>("30d");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("views");
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  const days = PERIODS.find((p) => p.key === period)!.days;
  const dates = useMemo(() => buildDateRange(days), [days]);
  const prevDates = useMemo(() => buildDateRange(days * 2).slice(0, days), [days]);

  // ─── Index analytics by date ──────────────────────────────────────────
  const analyticsMap = useMemo(() => {
    const map = new Map<string, Map<string, AnalyticsRow>>();
    for (const row of analytics) {
      if (!map.has(row.listing_id)) map.set(row.listing_id, new Map());
      map.get(row.listing_id)!.set(row.date, row);
    }
    return map;
  }, [analytics]);

  function getVal(listingId: string, date: string, m: MetricKey): number {
    return analyticsMap.get(listingId)?.get(date)?.[m] ?? 0;
  }

  // ─── Aggregated series for all listings ───────────────────────────────
  const aggregatedSeries = useMemo(() => {
    return dates.map((date) =>
      listings.reduce((sum, l) => sum + getVal(l.id, date, activeMetric), 0),
    );
  }, [dates, listings, activeMetric, analyticsMap]);

  const prevAggregated = useMemo(() => {
    return prevDates.map((date) =>
      listings.reduce((sum, l) => sum + getVal(l.id, date, activeMetric), 0),
    );
  }, [prevDates, listings, activeMetric, analyticsMap]);

  const periodTotal = aggregatedSeries.reduce((a, b) => a + b, 0);
  const prevTotal = prevAggregated.reduce((a, b) => a + b, 0);
  const pctChange = prevTotal > 0 ? Math.round(((periodTotal - prevTotal) / prevTotal) * 100) : null;

  // ─── Per-listing series (for selected listing) ────────────────────────
  const listingSeries = useMemo(() => {
    if (!selectedListing) return [];
    return dates.map((d) => getVal(selectedListing, d, activeMetric));
  }, [selectedListing, dates, activeMetric, analyticsMap]);

  const listingPeriodTotal = listingSeries.reduce((a, b) => a + b, 0);

  // ─── KPI Metrics ──────────────────────────────────────────────────────
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalFavorites = listings.reduce((s, l) => s + l.favorite_count, 0);
  const totalMessages = listings.reduce((s, l) => s + l.message_count, 0);
  const activeListings = listings.filter((l) => l.status === "active").length;
  const soldListings = listings.filter((l) => l.status === "sold").length;
  const draftListings = listings.filter((l) => l.status === "draft").length;
  const pausedListings = listings.filter((l) => l.status === "paused").length;

  const enquiryRate = totalViews > 0 ? ((totalMessages / totalViews) * 100) : 0;
  const saveRate = totalViews > 0 ? ((totalFavorites / totalViews) * 100) : 0;

  // ─── Revenue from accepted offers ─────────────────────────────────────
  const acceptedOffers = offers.filter((o) => o.status === "accepted");
  const totalRevenue = acceptedOffers.reduce((s, o) => s + o.amount, 0);
  const pendingOffers = offers.filter((o) => o.status === "pending");
  const pendingValue = pendingOffers.reduce((s, o) => s + o.amount, 0);

  // Monthly revenue breakdown
  const monthlyRevenue = useMemo(() => {
    const months = new Map<string, number>();
    for (const o of acceptedOffers) {
      const d = new Date(o.responded_at || o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.set(key, (months.get(key) ?? 0) + o.amount);
    }
    // Last 6 months
    const result: { month: string; label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-GB", { month: "short" });
      result.push({ month: key, label, amount: months.get(key) ?? 0 });
    }
    return result;
  }, [acceptedOffers]);

  // ─── Top performers ───────────────────────────────────────────────────
  const topByViews = useMemo(
    () =>
      [...listings]
        .filter((l) => l.status === "active")
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 5),
    [listings],
  );

  const topByEngagement = useMemo(
    () =>
      [...listings]
        .filter((l) => l.status === "active" && l.view_count > 0)
        .sort(
          (a, b) =>
            (b.favorite_count + b.message_count) / Math.max(b.view_count, 1) -
            (a.favorite_count + a.message_count) / Math.max(a.view_count, 1),
        )
        .slice(0, 5),
    [listings],
  );

  // ─── Category breakdown ───────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const map = new Map<string, { name: string; count: number; views: number; saves: number; messages: number }>();
    for (const l of listings) {
      const cat = l.categories?.name ?? "Uncategorized";
      const existing = map.get(cat) ?? { name: cat, count: 0, views: 0, saves: 0, messages: 0 };
      existing.count++;
      existing.views += l.view_count;
      existing.saves += l.favorite_count;
      existing.messages += l.message_count;
      map.set(cat, existing);
    }
    return [...map.values()].sort((a, b) => b.views - a.views);
  }, [listings]);

  const metricConfig = METRIC_CONFIG.find((m) => m.key === activeMetric)!;

  // ─── Per-metric period totals for KPI cards ───────────────────────────
  const periodViews = useMemo(() => dates.reduce((sum, d) => sum + listings.reduce((s, l) => s + getVal(l.id, d, "views"), 0), 0), [dates, listings, analyticsMap]);
  const periodFaves = useMemo(() => dates.reduce((sum, d) => sum + listings.reduce((s, l) => s + getVal(l.id, d, "favorites"), 0), 0), [dates, listings, analyticsMap]);
  const periodMsgs = useMemo(() => dates.reduce((sum, d) => sum + listings.reduce((s, l) => s + getVal(l.id, d, "messages"), 0), 0), [dates, listings, analyticsMap]);

  // Previous period for each metric
  const prevViews = useMemo(() => prevDates.reduce((sum, d) => sum + listings.reduce((s, l) => s + getVal(l.id, d, "views"), 0), 0), [prevDates, listings, analyticsMap]);
  const prevFaves = useMemo(() => prevDates.reduce((sum, d) => sum + listings.reduce((s, l) => s + getVal(l.id, d, "favorites"), 0), 0), [prevDates, listings, analyticsMap]);
  const prevMsgs = useMemo(() => prevDates.reduce((sum, d) => sum + listings.reduce((s, l) => s + getVal(l.id, d, "messages"), 0), 0), [prevDates, listings, analyticsMap]);

  function calcChange(cur: number, prev: number): number | null {
    return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
  }

  function ChangeIndicator({ change }: { change: number | null }) {
    if (change === null) return <span className="text-[10px] text-[#8a8280]">New</span>;
    const isUp = change >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${isUp ? "text-emerald-600" : "text-red-500"}`}>
        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {isUp ? "+" : ""}{change}%
      </span>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1a1a1a]">Shop Analytics</h3>
          <p className="text-sm text-[#6b6560] mt-0.5">Performance insights across all your listings</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 bg-[#f0eeeb] p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === p.key
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-[#6b6560] hover:text-[#1a1a1a]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── KPI Cards with sparklines ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Views",
            value: periodViews,
            allTime: totalViews,
            change: calcChange(periodViews, prevViews),
            icon: Eye,
            color: "#8E7A6B",
            bgLight: "bg-[#f0eeeb]",
            metricKey: "views" as MetricKey,
          },
          {
            label: "Saves",
            value: periodFaves,
            allTime: totalFavorites,
            change: calcChange(periodFaves, prevFaves),
            icon: Heart,
            color: "#ec4899",
            bgLight: "bg-pink-50",
            metricKey: "favorites" as MetricKey,
          },
          {
            label: "Enquiries",
            value: periodMsgs,
            allTime: totalMessages,
            change: calcChange(periodMsgs, prevMsgs),
            icon: MessageCircle,
            color: "#10b981",
            bgLight: "bg-emerald-50",
            metricKey: "messages" as MetricKey,
          },
          {
            label: "Enquiry Rate",
            value: enquiryRate,
            isRate: true,
            icon: Percent,
            color: "#6366f1",
            bgLight: "bg-indigo-50",
          },
        ].map((card) => {
          const isSelected = "metricKey" in card && card.metricKey === activeMetric;
          return (
            <button
              key={card.label}
              onClick={() => "metricKey" in card && card.metricKey && setActiveMetric(card.metricKey)}
              className={`text-left bg-white border p-4 transition-all hover:shadow-md ${
                isSelected ? "border-[#8E7A6B] ring-2 ring-[#8E7A6B]/10" : "border-[#e8e6e3]"
              } ${"metricKey" in card ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 ${card.bgLight} flex items-center justify-center rounded-lg`}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                {"change" in card && <ChangeIndicator change={card.change ?? null} />}
              </div>
              <div className="text-2xl font-bold text-[#1a1a1a]">
                {"isRate" in card ? `${card.value.toFixed(1)}%` : card.value.toLocaleString()}
              </div>
              <div className="text-xs text-[#6b6560] mt-0.5">{card.label} ({period})</div>
              {"allTime" in card && (
                <div className="text-[10px] text-[#8a8280] mt-0.5">
                  {card.allTime?.toLocaleString()} all-time
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Main Chart (aggregate overview) ─────────────────────── */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-[#1a1a1a]">
            All Listings — {metricConfig.label}
          </h4>
          <div className="flex items-center gap-2">
            {pctChange !== null && (
              <span
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  pctChange >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}
              >
                {pctChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {pctChange >= 0 ? "+" : ""}{pctChange}%
              </span>
            )}
            <span className="text-xl font-bold text-[#1a1a1a]">
              {periodTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric pills */}
        <div className="flex items-center gap-2 mb-4">
          {METRIC_CONFIG.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                activeMetric === m.key
                  ? "border-current bg-white shadow-sm"
                  : "border-transparent text-[#6b6560] hover:bg-[#f0eeeb]"
              }`}
              style={activeMetric === m.key ? { color: m.color } : undefined}
            >
              <m.icon className="w-3 h-3" />
              {m.label}
            </button>
          ))}
        </div>

        <AreaChart
          dates={dates}
          values={aggregatedSeries}
          color={metricConfig.color}
          height={220}
        />

        <div className="flex justify-between mt-2 text-[10px] text-[#8a8280]">
          <span>{formatDate(dates[0], true)}</span>
          {dates.length > 14 && <span>{formatDate(dates[Math.floor(dates.length / 2)], true)}</span>}
          <span>Today</span>
        </div>
      </div>

      {/* ─── Revenue + Offers + Status row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue card */}
        <div className="bg-white border border-[#e8e6e3] p-5">
          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <Euro className="w-4 h-4 text-[#8a8280]" />
            Revenue
          </h4>
          <div className="text-3xl font-bold text-[#1a1a1a] mb-1">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-[#6b6560] mb-4">
            {acceptedOffers.length} completed {acceptedOffers.length === 1 ? "sale" : "sales"}
          </div>
          {pendingOffers.length > 0 && (
            <div className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              {formatCurrency(pendingValue)} in {pendingOffers.length} pending {pendingOffers.length === 1 ? "offer" : "offers"}
            </div>
          )}
          {/* Monthly revenue bars */}
          <div className="mt-2">
            <MiniBarChart
              values={monthlyRevenue.map((m) => m.amount)}
              color="#8E7A6B"
              height={56}
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-[#8a8280]">
              {monthlyRevenue.map((m) => (
                <span key={m.month}>{m.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Listing Status donut */}
        <div className="bg-white border border-[#e8e6e3] p-5">
          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#8a8280]" />
            Listing Status
          </h4>
          <div className="flex items-center gap-6">
            <DonutChart
              segments={[
                { label: "Active", value: activeListings, color: "#10b981" },
                { label: "Sold", value: soldListings, color: "#8E7A6B" },
                { label: "Draft", value: draftListings, color: "#f59e0b" },
                { label: "Paused", value: pausedListings, color: "#f97316" },
              ]}
            />
            <div className="flex-1 space-y-2">
              {[
                { label: "Active", count: activeListings, color: "bg-emerald-500" },
                { label: "Sold", count: soldListings, color: "bg-[#8E7A6B]" },
                { label: "Draft", count: draftListings, color: "bg-amber-400" },
                { label: "Paused", count: pausedListings, color: "bg-orange-400" },
              ]
                .filter((s) => s.count > 0)
                .map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="text-[#6b6560]">{s.label}</span>
                    <span className="font-semibold text-[#1a1a1a] ml-auto">{s.count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-[#e8e6e3] p-5">
          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#8a8280]" />
            By Category
          </h4>
          <div className="space-y-3">
            {categoryStats.map((cat) => {
              const maxViews = Math.max(...categoryStats.map((c) => c.views), 1);
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-[#1a1a1a]">{cat.name}</span>
                    <span className="text-[#6b6560]">
                      {cat.count} · {cat.views.toLocaleString()} views
                    </span>
                  </div>
                  <div className="h-2 bg-[#f0eeeb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8E7A6B] to-[#b09e8f] rounded-full transition-all duration-500"
                      style={{ width: `${(cat.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Per-listing performance (accordion) ────────────────────── */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#8a8280]" />
          Listing Performance
          <span className="text-[10px] text-[#8a8280] font-normal ml-1">click to expand</span>
        </h4>

        {/* Column headers */}
        <div className="grid grid-cols-[20px_1fr_80px_60px_60px_60px_60px] gap-3 items-center text-[10px] font-semibold text-[#8a8280] uppercase tracking-wider px-3 pb-2 border-b border-[#e8e6e3]">
          <span />
          <span>Listing</span>
          <span className="text-center">Trend</span>
          <span className="text-right">Views</span>
          <span className="text-right">Saves</span>
          <span className="text-right">Msgs</span>
          <span className="text-right">Eng. %</span>
        </div>

        <div className="divide-y divide-[#f0eeeb]">
          {[...listings]
            .filter((l) => l.status !== "removed")
            .sort((a, b) => b.view_count - a.view_count)
            .slice(0, 15)
            .map((l) => {
              const spark = dates.slice(-7).map((d) => getVal(l.id, d, "views"));
              const eng = l.view_count > 0 ? ((l.favorite_count + l.message_count) / l.view_count * 100) : 0;
              const isExpanded = selectedListing === l.id;

              // Build per-listing series for all 3 metrics when expanded
              const lViews = dates.map((d) => getVal(l.id, d, "views"));
              const lFaves = dates.map((d) => getVal(l.id, d, "favorites"));
              const lMsgs = dates.map((d) => getVal(l.id, d, "messages"));
              const lViewsTotal = lViews.reduce((a, b) => a + b, 0);
              const lFavesTotal = lFaves.reduce((a, b) => a + b, 0);
              const lMsgsTotal = lMsgs.reduce((a, b) => a + b, 0);

              return (
                <div key={l.id}>
                  {/* Row */}
                  <button
                    onClick={() => setSelectedListing(isExpanded ? null : l.id)}
                    className={`grid grid-cols-[20px_1fr_80px_60px_60px_60px_60px] gap-3 items-center w-full text-left py-3 px-3 transition-all hover:bg-[#faf9f7] ${
                      isExpanded ? "bg-[#faf9f7]" : ""
                    }`}
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-[#8a8280] transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#f0eeeb] overflow-hidden shrink-0 relative rounded">
                        {l.primary_image_url && (
                          <Image src={l.primary_image_url} alt="" fill className="object-cover" sizes="36px" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1a1a1a] truncate hover:text-[#8E7A6B] transition-colors">{l.title}</p>
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${
                          l.status === "active" ? "bg-emerald-50 text-emerald-600" :
                          l.status === "sold" ? "bg-[#f0eeeb] text-[#6b6560]" :
                          l.status === "paused" ? "bg-orange-50 text-orange-600" :
                          "bg-amber-50 text-amber-600"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Sparkline data={spark} color={isExpanded ? "#8E7A6B" : "#9ca3af"} />
                    </div>
                    <span className="text-sm text-[#1a1a1a] font-medium text-right">{l.view_count.toLocaleString()}</span>
                    <span className="text-sm text-[#1a1a1a] text-right">{l.favorite_count}</span>
                    <span className="text-sm text-[#1a1a1a] text-right">{l.message_count}</span>
                    <span className={`text-sm font-medium text-right ${eng >= 10 ? "text-emerald-600" : eng >= 5 ? "text-amber-600" : "text-[#8a8280]"}`}>
                      {eng.toFixed(1)}%
                    </span>
                  </button>

                  {/* Expanded accordion panel */}
                  {isExpanded && (
                    <div className="px-3 pb-5 bg-[#faf9f7] border-t border-[#e8e6e3] animate-in slide-in-from-top-1 duration-200">
                      {/* Mini KPI row for this listing */}
                      <div className="grid grid-cols-3 gap-3 pt-4 pb-3">
                        {[
                          { label: "Views", value: lViewsTotal, allTime: l.view_count, color: "#8E7A6B", icon: Eye },
                          { label: "Saves", value: lFavesTotal, allTime: l.favorite_count, color: "#ec4899", icon: Heart },
                          { label: "Enquiries", value: lMsgsTotal, allTime: l.message_count, color: "#10b981", icon: MessageCircle },
                        ].map((m) => (
                          <div key={m.label} className="bg-white border border-[#e8e6e3] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                              <span className="text-[10px] text-[#8a8280] uppercase tracking-wider">{m.label} ({period})</span>
                            </div>
                            <div className="text-lg font-bold text-[#1a1a1a]">{m.value.toLocaleString()}</div>
                            <div className="text-[10px] text-[#8a8280]">{m.allTime.toLocaleString()} all-time</div>
                          </div>
                        ))}
                      </div>

                      {/* Views chart */}
                      <div className="bg-white border border-[#e8e6e3] rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-[#8E7A6B]" />
                            Views over {period}
                          </span>
                          <span className="text-sm font-bold text-[#1a1a1a]">{lViewsTotal.toLocaleString()}</span>
                        </div>
                        <AreaChart dates={dates} values={lViews} color="#8E7A6B" height={140} />
                        <div className="flex justify-between mt-1.5 text-[9px] text-[#8a8280]">
                          <span>{formatDate(dates[0], true)}</span>
                          <span>Today</span>
                        </div>
                      </div>

                      {/* Saves + Enquiries side by side mini charts */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-[#e8e6e3] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 text-pink-500" />
                              Saves
                            </span>
                            <span className="text-sm font-bold text-[#1a1a1a]">{lFavesTotal}</span>
                          </div>
                          <MiniBarChart values={lFaves} color="#ec4899" height={48} />
                        </div>
                        <div className="bg-white border border-[#e8e6e3] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Enquiries
                            </span>
                            <span className="text-sm font-bold text-[#1a1a1a]">{lMsgsTotal}</span>
                          </div>
                          <MiniBarChart values={lMsgs} color="#10b981" height={48} />
                        </div>
                      </div>

                      {/* Link to listing */}
                      <div className="mt-3 text-right">
                        <Link
                          href={`/listing/${l.slug}`}
                          className="text-xs text-[#8E7A6B] hover:underline inline-flex items-center gap-1"
                        >
                          View listing
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ─── Top Performers ─────────────────────────────────────── */}
      <div className="bg-white border border-[#e8e6e3] p-5 space-y-5">
        {/* Most viewed */}
        <div>
          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#8a8280]" />
            Most Viewed
          </h4>
          <div className="space-y-1">
            {topByViews.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setSelectedListing(selectedListing === l.id ? null : l.id)}
                className="flex items-center gap-3 w-full p-2 hover:bg-[#faf9f7] rounded-lg transition-colors text-left"
              >
                <span className="text-xs font-bold text-[#8a8280] w-4">{i + 1}</span>
                <div className="w-8 h-8 bg-[#f0eeeb] overflow-hidden shrink-0 relative rounded">
                  {l.primary_image_url && <Image src={l.primary_image_url} alt="" fill className="object-cover" sizes="32px" />}
                </div>
                <p className="text-sm text-[#1a1a1a] truncate flex-1">{l.title}</p>
                <span className="text-xs font-semibold text-[#8E7A6B]">{l.view_count.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e8e6e3]" />

        {/* Highest engagement */}
        <div>
          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#8a8280]" />
            Highest Engagement
          </h4>
          <div className="space-y-1">
            {topByEngagement.map((l, i) => {
              const eng = l.view_count > 0 ? ((l.favorite_count + l.message_count) / l.view_count * 100) : 0;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedListing(selectedListing === l.id ? null : l.id)}
                  className="flex items-center gap-3 w-full p-2 hover:bg-[#faf9f7] rounded-lg transition-colors text-left"
                >
                  <span className="text-xs font-bold text-[#8a8280] w-4">{i + 1}</span>
                  <div className="w-8 h-8 bg-[#f0eeeb] overflow-hidden shrink-0 relative rounded">
                    {l.primary_image_url && <Image src={l.primary_image_url} alt="" fill className="object-cover" sizes="32px" />}
                  </div>
                  <p className="text-sm text-[#1a1a1a] truncate flex-1">{l.title}</p>
                  <span className={`text-xs font-semibold ${eng >= 10 ? "text-emerald-600" : "text-amber-600"}`}>{eng.toFixed(1)}%</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
