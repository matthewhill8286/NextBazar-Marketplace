"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PricePoint = {
  id: string;
  old_price: number | null;
  new_price: number | null;
  changed_at: string;
};

type Props = {
  listingId: string;
  currentPrice: number | null;
  currency: string;
};

export default function PriceHistory({
  listingId,
  currentPrice,
  currency,
}: Props) {
  const supabase = createClient();
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const sym = currency === "EUR" ? "€" : currency;

  useEffect(() => {
    supabase
      .from("price_history")
      .select("id, old_price, new_price, changed_at")
      .eq("listing_id", listingId)
      .order("changed_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setHistory(data || []);
        setLoading(false);
      });
  }, [listingId]);

  if (loading || history.length === 0) return null;

  // Build chart points: oldest → newest → current
  const reversed = [...history].reverse();
  const allPoints: { price: number; date: string; label: string }[] = [];

  // Seed with the very first "old_price"
  if (reversed[0]?.old_price != null) {
    allPoints.push({
      price: reversed[0].old_price,
      date: reversed[0].changed_at,
      label: "Original",
    });
  }

  for (const h of reversed) {
    if (h.new_price != null) {
      allPoints.push({
        price: h.new_price,
        date: h.changed_at,
        label: new Date(h.changed_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      });
    }
  }

  // Add the CURRENT price as the absolute latest point
  if (currentPrice != null) {
    const lastPoint = allPoints[allPoints.length - 1];
    if (!lastPoint || lastPoint.price !== currentPrice) {
      allPoints.push({
        price: currentPrice,
        date: new Date().toISOString(),
        label: "Current",
      });
    }
  }

  if (allPoints.length < 2) return null;

  const prices = allPoints.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const W = 300;
  const H = 60;
  const PAD = 8;

  const pts = allPoints.map((p, i) => {
    const x = PAD + (i / (allPoints.length - 1)) * (W - PAD * 2);
    const y = PAD + ((maxP - p.price) / range) * (H - PAD * 2);
    return { x, y, ...p };
  });

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Fill under the line
  // biome-ignore lint/style/useTemplate: this is a template string
  const fillD = pathD + ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const firstPrice = allPoints[0].price;
  const lastPrice = allPoints[allPoints.length - 1].price;
  const pctChange =
    firstPrice > 0
      ? Math.round(((lastPrice - firstPrice) / firstPrice) * 100)
      : 0;
  const isDown = pctChange < 0;
  const isUp = pctChange > 0;
  const lineColor = isDown ? "#10b981" : isUp ? "#ef4444" : "#6b7280";
  const fillColor = isDown ? "#d1fae5" : isUp ? "#fee2e2" : "#f3f4f6";

  const displayHistory = [...history];
  const lastHistoryPoint = displayHistory[0];

  if (currentPrice != null && lastHistoryPoint?.new_price !== currentPrice) {
    displayHistory.unshift({
      id: "current",
      old_price: lastHistoryPoint?.new_price || null,
      new_price: currentPrice,
      changed_at: new Date().toISOString(),
    });
  }

  return (
    <div className="bg-white border border-[#e8e6e3] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1a1a1a] text-sm">Price History</h3>
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            isDown
              ? "bg-green-50 text-green-700"
              : isUp
                ? "bg-red-50 text-red-600"
                : "bg-[#f0eeeb] text-[#6b6560]"
          }`}
        >
          {isDown ? (
            <TrendingDown className="w-3 h-3" />
          ) : isUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {isDown
            ? `${Math.abs(pctChange)}% drop`
            : isUp
              ? `${pctChange}% rise`
              : "No change"}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 200, height: 60 }}
        >
          <path d={fillD} fill={fillColor} opacity="0.6" />
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map((p) => (
            <circle key={`${p}`} cx={p.x} cy={p.y} r="3" fill={lineColor} />
          ))}
        </svg>
      </div>

      {/* Price list */}
      <div className="mt-3 space-y-1.5">
        {displayHistory.map((h) => {
          const isDropped =
            h.old_price != null &&
            h.new_price != null &&
            h.new_price < h.old_price;
          const isRaised =
            h.old_price != null &&
            h.new_price != null &&
            h.new_price > h.old_price;
          return (
            <div
              key={h.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-[#8a8280]">
                {new Date(h.changed_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <div className="flex items-center gap-2">
                {h.old_price != null && (
                  <span className="text-[#8a8280] line-through">
                    {sym}
                    {h.old_price.toLocaleString()}
                  </span>
                )}
                <span
                  className={`font-semibold ${
                    isDropped
                      ? "text-green-600"
                      : isRaised
                        ? "text-red-500"
                        : "text-[#666]"
                  }`}
                >
                  {sym}
                  {h.new_price?.toLocaleString() ?? "—"}
                </span>
                {isDropped && (
                  <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                    ↓{" "}
                    {Math.round(
                      ((h.old_price! - h.new_price!) / h.old_price!) * 100,
                    )}
                    %
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
