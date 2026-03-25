"use client";

import {
  Eye,
  Heart,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import ShopUrlCard from "./shop-url-card";
import type { ListingRow } from "./types";

type Props = {
  listings: ListingRow[];
  slug: string;
};

export default function OverviewTab({ listings, slug }: Props) {
  const activeListings = listings.filter((l) => l.status === "active");
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalFavorites = listings.reduce((s, l) => s + l.favorite_count, 0);
  const totalMessages = listings.reduce((s, l) => s + l.message_count, 0);

  const stats = [
    {
      label: "Active Listings",
      value: activeListings.length,
      icon: ShoppingBag,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Favorites",
      value: totalFavorites.toLocaleString(),
      icon: Heart,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Messages",
      value: totalMessages.toLocaleString(),
      icon: MessageCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
          >
            <div
              className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}
            >
              <s.icon className={`w-[18px] h-[18px] ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Shop URL */}
      <ShopUrlCard slug={slug} />

      {/* Top performing listings */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          Top Performing Listings
        </h3>
        <div className="space-y-2">
          {activeListings
            .sort((a, b) => b.view_count - a.view_count)
            .slice(0, 5)
            .map((l, i) => (
              <Link
                key={l.id}
                href={`/listing/${l.slug}`}
                className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xs font-semibold text-gray-300 w-5 text-center">
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {l.primary_image_url && (
                    <img
                      src={l.primary_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {l.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {l.view_count} views &middot; {l.favorite_count} saves
                  </p>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  &euro;{l.price?.toLocaleString() ?? "&mdash;"}
                </div>
              </Link>
            ))}
          {activeListings.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              No listings yet
            </p>
          )}
        </div>
      </div>
    </>
  );
}
