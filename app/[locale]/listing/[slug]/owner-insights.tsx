"use client";

import { Activity, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import AiInsights, { type InsightsPriceSummaryAction } from "./ai-insights";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  listingId: string;
  listingUserId: string;
  price: number | null;
  currency: string;
  descriptionLength: number;
  galleryImageCount: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Owner-only section: market value indicator, listing quality score, and AI
 * insights panel.  Renders nothing for non-owners to avoid layout shift.
 */
export default function OwnerInsights({
  listingId,
  listingUserId,
  price,
  currency,
  descriptionLength,
  galleryImageCount,
}: Props) {
  const t = useTranslations("listing");
  const { userId } = useAuth();
  const [aiPrice, setAiPrice] = useState<InsightsPriceSummaryAction | null>(
    null,
  );

  // Only render for the listing owner
  if (!userId || userId !== listingUserId) return null;

  const qualityScore = Math.min(
    100,
    40 + galleryImageCount * 10 + (descriptionLength > 100 ? 20 : 0),
  );

  function formatPrice(p: number | null, cur: string): string {
    if (p === null) return t("contactForPrice");
    const sym = cur === "EUR" ? "€" : cur;
    return `${sym}${p.toLocaleString()}`;
  }

  const priceEstLow =
    aiPrice && !aiPrice.loading && aiPrice.price_low
      ? aiPrice.price_low
      : price
        ? Math.round(price * 0.85)
        : 0;
  const priceEstHigh =
    aiPrice && !aiPrice.loading && aiPrice.price_high
      ? aiPrice.price_high
      : price
        ? Math.round(price * 1.15)
        : 0;
  const aiMarketLoading = !aiPrice || aiPrice.loading;

  return (
    <>
      {/* Market value + Quality score card */}
      {price && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Owner Insights
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Market value range */}
            <div className="bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <Shield className="w-3 h-3 text-indigo-500" />
                {t("marketValue")}
              </div>
              {aiMarketLoading ? (
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-sm text-gray-700">
                    {formatPrice(priceEstLow, currency)} –{" "}
                    {formatPrice(priceEstHigh, currency)}
                  </span>
                  {aiPrice?.price_verdict &&
                    aiPrice.price_verdict !== "no_data" && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          aiPrice.price_verdict === "underpriced"
                            ? "bg-green-100 text-green-700"
                            : aiPrice.price_verdict === "overpriced"
                              ? "bg-red-100 text-red-700"
                              : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {aiPrice.price_verdict === "underpriced"
                          ? t("belowMarket")
                          : aiPrice.price_verdict === "overpriced"
                            ? t("aboveMarket")
                            : t("fairPrice")}
                      </span>
                    )}
                  <span className="text-[10px] text-gray-400">· AI</span>
                </div>
              )}
            </div>

            {/* Quality score */}
            <div className="bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <Activity
                  className={`w-3 h-3 ${
                    qualityScore >= 80
                      ? "text-green-500"
                      : qualityScore >= 50
                        ? "text-indigo-500"
                        : "text-amber-500"
                  }`}
                />
                {t("listingQuality")}
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {qualityScore}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights panel */}
      <AiInsights listingId={listingId} onInsightsAction={setAiPrice} />
    </>
  );
}
