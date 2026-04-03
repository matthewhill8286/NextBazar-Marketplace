"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Percent,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { SellerTier } from "@/lib/pricing-config";
import { getPlanLimits } from "@/lib/plan-limits";
import UpgradeGate from "@/app/components/upgrade-gate";
import type { ListingRow } from "./types";

type Props = {
  listings: ListingRow[];
  planTier?: SellerTier;
};

type Period = "7d" | "30d" | "all";

export default function AnalyticsTab({ listings, planTier = "starter" }: Props) {
  const limits = getPlanLimits(planTier);

  if (!limits.analytics) {
    return (
      <UpgradeGate
        feature="Analytics Dashboard"
        currentPlan={limits.tierLabel}
        requiredPlan="Pro"
        allowed={false}
      >
        <div />
      </UpgradeGate>
    );
  }
  const [period] = useState<Period>("all");

  // ─── Aggregate stats ──────────────────────────────────────────────────
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalFavorites = listings.reduce((s, l) => s + l.favorite_count, 0);
  const totalMessages = listings.reduce((s, l) => s + l.message_count, 0);
  const activeCount = listings.filter((l) => l.status === "active").length;
  const soldCount = listings.filter((l) => l.status === "sold").length;
  const draftCount = listings.filter((l) => l.status === "draft").length;

  const conversionRate =
    totalViews > 0 ? ((totalMessages / totalViews) * 100).toFixed(1) : "0.0";
  const saveRate =
    totalViews > 0 ? ((totalFavorites / totalViews) * 100).toFixed(1) : "0.0";

  // ─── Top performing listings ──────────────────────────────────────────
  const topByViews = useMemo(
    () =>
      [...listings]
        .filter((l) => l.status === "active")
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10),
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
        .slice(0, 10),
    [listings],
  );

  // ─── Category breakdown ───────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; views: number; saves: number }
    >();
    for (const l of listings) {
      const cat = l.categories?.name ?? "Uncategorized";
      const existing = map.get(cat) ?? { name: cat, count: 0, views: 0, saves: 0 };
      existing.count++;
      existing.views += l.view_count;
      existing.saves += l.favorite_count;
      map.set(cat, existing);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [listings]);

  // ─── Status distribution ──────────────────────────────────────────────
  const statusDistribution = [
    {
      label: "Active",
      count: activeCount,
      color: "bg-emerald-500",
      pct:
        listings.length > 0
          ? ((activeCount / listings.length) * 100).toFixed(0)
          : "0",
    },
    {
      label: "Sold",
      count: soldCount,
      color: "bg-[#8E7A6B]",
      pct:
        listings.length > 0
          ? ((soldCount / listings.length) * 100).toFixed(0)
          : "0",
    },
    {
      label: "Draft",
      count: draftCount,
      color: "bg-amber-400",
      pct:
        listings.length > 0
          ? ((draftCount / listings.length) * 100).toFixed(0)
          : "0",
    },
    {
      label: "Other",
      count:
        listings.length - activeCount - soldCount - draftCount,
      color: "bg-[#e8e6e3]",
      pct:
        listings.length > 0
          ? (
              ((listings.length - activeCount - soldCount - draftCount) /
                listings.length) *
              100
            ).toFixed(0)
          : "0",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#1a1a1a]">
        Shop Analytics
      </h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Views",
            value: totalViews.toLocaleString(),
            icon: Eye,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Saves",
            value: totalFavorites.toLocaleString(),
            icon: Heart,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "Enquiry Rate",
            value: `${conversionRate}%`,
            icon: Percent,
            color: "text-blue-600",
            bg: "bg-blue-50",
            subtitle: `${totalMessages} enquiries`,
          },
          {
            label: "Save Rate",
            value: `${saveRate}%`,
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-50",
            subtitle: `${totalFavorites} saves`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-[#e8e6e3] p-5 hover:shadow-sm transition-shadow"
          >
            <div
              className={`w-9 h-9 ${s.bg} flex items-center justify-center mb-3`}
            >
              <s.icon className={`w-[18px] h-[18px] ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{s.value}</div>
            <div className="text-xs text-[#6b6560] mt-0.5">
              {s.label}
              {s.subtitle && (
                <span className="text-[10px] ml-1">({s.subtitle})</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="bg-white border border-[#e8e6e3] p-5">
          <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#8a8280]" />
            Listing Status
          </h4>

          {/* Visual bar */}
          <div className="h-3 flex overflow-hidden mb-4">
            {statusDistribution
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.label}
                  className={`${s.color} transition-all`}
                  style={{
                    width: `${(s.count / Math.max(listings.length, 1)) * 100}%`,
                  }}
                />
              ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statusDistribution.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 text-xs"
              >
                <div className={`w-2.5 h-2.5 ${s.color}`} />
                <span className="text-[#6b6560]">{s.label}</span>
                <span className="font-semibold text-[#1a1a1a] ml-auto">
                  {s.count}
                </span>
                <span className="text-[#8a8280]">({s.pct}%)</span>
              </div>
            ))}
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
              const pct =
                listings.length > 0
                  ? (cat.count / listings.length) * 100
                  : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-[#1a1a1a]">
                      {cat.name}
                    </span>
                    <span className="text-[#6b6560]">
                      {cat.count} listings &middot; {cat.views} views
                    </span>
                  </div>
                  <div className="h-2 bg-[#f0eeeb] overflow-hidden">
                    <div
                      className="h-full bg-[#8E7A6B] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categoryStats.length === 0 && (
              <p className="text-xs text-[#8a8280] text-center py-4">
                No data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top by views */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#8a8280]" />
          Most Viewed Listings
        </h4>
        <div className="space-y-1.5">
          {topByViews.map((l, i) => (
            <Link
              key={l.id}
              href={`/listing/${l.slug}`}
              className="flex items-center gap-3 p-2.5 -mx-2 hover:bg-[#faf9f7] transition-colors group"
            >
              <span className="text-xs font-semibold text-[#8a8280] w-5 text-center">
                {i + 1}
              </span>
              <div className="w-9 h-9 bg-[#f0eeeb] overflow-hidden shrink-0 relative">
                {l.primary_image_url && (
                  <Image
                    src={l.primary_image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#8E7A6B] transition-colors">
                  {l.title}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6b6560] shrink-0">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {l.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {l.favorite_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {l.message_count}
                </span>
              </div>
            </Link>
          ))}
          {topByViews.length === 0 && (
            <p className="text-xs text-[#8a8280] text-center py-6">
              No active listings yet
            </p>
          )}
        </div>
      </div>

      {/* Top by engagement rate */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#8a8280]" />
          Highest Engagement Rate
        </h4>
        <div className="space-y-1.5">
          {topByEngagement.map((l, i) => {
            const engRate =
              l.view_count > 0
                ? (
                    ((l.favorite_count + l.message_count) / l.view_count) *
                    100
                  ).toFixed(1)
                : "0.0";
            return (
              <Link
                key={l.id}
                href={`/listing/${l.slug}`}
                className="flex items-center gap-3 p-2.5 -mx-2 hover:bg-[#faf9f7] transition-colors group"
              >
                <span className="text-xs font-semibold text-[#8a8280] w-5 text-center">
                  {i + 1}
                </span>
                <div className="w-9 h-9 bg-[#f0eeeb] overflow-hidden shrink-0 relative">
                  {l.primary_image_url && (
                    <Image
                      src={l.primary_image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a] truncate group-hover:text-[#8E7A6B] transition-colors">
                    {l.title}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#8E7A6B] shrink-0">
                  {engRate}%
                </span>
              </Link>
            );
          })}
          {topByEngagement.length === 0 && (
            <p className="text-xs text-[#8a8280] text-center py-6">
              No data yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
