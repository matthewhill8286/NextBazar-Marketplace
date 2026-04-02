"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { ListingRow } from "./types";

type Props = {
  listings: ListingRow[];
};

type Period = "7d" | "30d" | "90d" | "all";

export default function SalesTab({ listings }: Props) {
  const [period, setPeriod] = useState<Period>("30d");

  const soldListings = useMemo(() => {
    const sold = listings.filter((l) => l.status === "sold");

    if (period === "all") return sold;

    const now = Date.now();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = now - days * 86_400_000;

    return sold.filter(
      (l) => new Date(l.updated_at ?? l.created_at).getTime() >= cutoff,
    );
  }, [listings, period]);

  const totalRevenue = soldListings.reduce((s, l) => s + (l.price ?? 0), 0);
  const avgPrice =
    soldListings.length > 0 ? totalRevenue / soldListings.length : 0;

  // Revenue comparison with previous period
  const previousPeriodSold = useMemo(() => {
    if (period === "all") return [];
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const now = Date.now();
    const currentCutoff = now - days * 86_400_000;
    const prevCutoff = now - days * 2 * 86_400_000;

    return listings.filter((l) => {
      if (l.status !== "sold") return false;
      const ts = new Date(l.updated_at ?? l.created_at).getTime();
      return ts >= prevCutoff && ts < currentCutoff;
    });
  }, [listings, period]);

  const prevRevenue = previousPeriodSold.reduce(
    (s, l) => s + (l.price ?? 0),
    0,
  );
  const revenueChange =
    prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : totalRevenue > 0
        ? 100
        : 0;

  const allTimeSold = listings.filter((l) => l.status === "sold");
  const allTimeRevenue = allTimeSold.reduce((s, l) => s + (l.price ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">Sales Overview</h3>
        <div className="flex gap-1 bg-[#f0eeeb] p-1">
          {(
            [
              { key: "7d", label: "7 days" },
              { key: "30d", label: "30 days" },
              { key: "90d", label: "90 days" },
              { key: "all", label: "All time" },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
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

      {/* Revenue stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-emerald-50 flex items-center justify-center mb-3">
            <DollarSign className="w-[18px] h-[18px] text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            &euro;{totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-[#6b6560]">Revenue</span>
            {period !== "all" && revenueChange !== 0 && (
              <span
                className={`inline-flex items-center text-[10px] font-semibold ${revenueChange > 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {revenueChange > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(revenueChange).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-[#f0eeeb] flex items-center justify-center mb-3">
            <Package className="w-[18px] h-[18px] text-[#8E7A6B]" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            {soldListings.length}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">Items Sold</div>
        </div>

        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-blue-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-[18px] h-[18px] text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            &euro;{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">Avg. Sale Price</div>
        </div>

        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-amber-50 flex items-center justify-center mb-3">
            <Calendar className="w-[18px] h-[18px] text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            &euro;{allTimeRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">All-Time Revenue</div>
        </div>
      </div>

      {/* Sold listings table */}
      <div className="bg-white border border-[#e8e6e3] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e6e3]">
          <h4 className="text-sm font-semibold text-[#1a1a1a]">
            Sold Items ({soldListings.length})
          </h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8e6e3] bg-[#faf9f7]/50">
              <th className="text-left px-4 py-3 font-medium text-[#6b6560]">
                Item
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560]">
                Sale Price
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560] hidden md:table-cell">
                Views
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560] hidden md:table-cell">
                Enquiries
              </th>
              <th className="text-right px-4 py-3 font-medium text-[#6b6560] hidden lg:table-cell">
                Sold Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#faf9f7]">
            {soldListings
              .sort(
                (a, b) =>
                  new Date(b.updated_at ?? b.created_at).getTime() -
                  new Date(a.updated_at ?? a.created_at).getTime(),
              )
              .map((l) => (
                <tr
                  key={l.id}
                  className="hover:bg-[#faf9f7]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/listing/${l.slug}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 bg-[#f0eeeb] overflow-hidden shrink-0 relative">
                        {l.primary_image_url && (
                          <Image
                            src={l.primary_image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        )}
                      </div>
                      <span className="font-medium text-[#1a1a1a] truncate max-w-[200px] group-hover:text-[#8E7A6B] transition-colors">
                        {l.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    {l.price != null
                      ? `\u20AC${l.price.toLocaleString()}`
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b6560] hidden md:table-cell">
                    {l.view_count}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b6560] hidden md:table-cell">
                    {l.message_count}
                  </td>
                  <td className="px-4 py-3 text-right text-[#6b6560] text-xs hidden lg:table-cell">
                    {new Date(
                      l.updated_at ?? l.created_at,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {soldListings.length === 0 && (
          <div className="text-center py-12 text-[#8a8280]">
            <Package className="w-8 h-8 mx-auto mb-2 text-[#8a8280]" />
            <p className="font-medium">No sales yet</p>
            <p className="text-xs mt-1 text-[#6b6560]">
              Sold items will appear here once a listing is marked as sold
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
