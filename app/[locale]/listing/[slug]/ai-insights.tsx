"use client";

import {
  BarChart3,
  Clock,
  Lightbulb,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

type InsightsData = {
  insights: {
    price_verdict: string;
    price_low: number;
    price_high: number;
    price_explanation: string;
    quality_score: number;
    quality_tips: string[];
    demand_level: string;
    demand_explanation: string;
    sell_time_estimate: string;
    top_tip: string;
  };
  market: {
    similar_count: number;
    avg_price: number | null;
    min_price: number | null;
    max_price: number | null;
    avg_views: number;
  };
};

export type InsightsPriceSummaryAction = {
  price_low: number;
  price_high: number;
  price_verdict: string;
  loading: boolean;
};

export default function AiInsights({
  listingId,
  onInsightsAction,
}: {
  listingId: string;
  onInsightsAction?: (summary: InsightsPriceSummaryAction) => void;
}) {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    onInsightsAction?.({
      price_low: 0,
      price_high: 0,
      price_verdict: "",
      loading: true,
    });
    async function load() {
      try {
        const res = await fetch("/api/ai/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        if (!res.ok) throw new Error();
        const result: InsightsData = await res.json();
        setData(result);
        onInsightsAction?.({
          price_low: result.insights.price_low,
          price_high: result.insights.price_high,
          price_verdict: result.insights.price_verdict,
          loading: false,
        });
      } catch {
        setError(true);
        onInsightsAction?.({
          price_low: 0,
          price_high: 0,
          price_verdict: "",
          loading: false,
        });
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#f0eeeb] via-[#f0eeeb] to-[#f0eeeb] p-6 border border-[#e8e6e3]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#8E7A6B] animate-pulse" />
          <span className="font-semibold text-[#1a1a1a]">
            AI is analyzing this listing...
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/60 p-4 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { insights, market } = data;

  const verdictColor =
    insights.price_verdict === "underpriced"
      ? "text-green-600"
      : insights.price_verdict === "overpriced"
        ? "text-red-600"
        : "text-[#8E7A6B]";

  const VerdictIcon =
    insights.price_verdict === "underpriced"
      ? TrendingDown
      : insights.price_verdict === "overpriced"
        ? TrendingUp
        : Shield;

  const verdictLabel =
    insights.price_verdict === "underpriced"
      ? "Below Market"
      : insights.price_verdict === "overpriced"
        ? "Above Market"
        : insights.price_verdict === "fair"
          ? "Fair Price"
          : "Limited Data";

  const demandColor =
    insights.demand_level === "high"
      ? "text-green-600 bg-green-50"
      : insights.demand_level === "medium"
        ? "text-amber-600 bg-amber-50"
        : "text-[#666] bg-[#f0eeeb]";

  return (
    <div className="bg-gradient-to-br from-[#f0eeeb] via-[#f0eeeb] to-[#f0eeeb] p-6 border border-[#e8e6e3]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#8E7A6B]" />
        <h2 className="text-lg font-semibold text-[#1a1a1a]">AI Insights</h2>
        <span className="text-[10px] bg-[#e8e6e3] text-[#7A6657] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
          Beta
        </span>
        {market.similar_count > 0 && (
          <span className="text-xs text-[#8E7A6B] ml-auto">
            Based on {market.similar_count} similar listings
          </span>
        )}
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Price Analysis */}
        <div className="bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-4 h-4 text-[#8a8280]" />
            <span className="text-[11px] text-[#6b6560] font-medium">
              Price Analysis
            </span>
          </div>
          <div className="font-bold text-[#1a1a1a] text-lg mb-1">
            €{insights.price_low?.toLocaleString()} — €
            {insights.price_high?.toLocaleString()}
          </div>
          <div
            className={`text-xs font-medium flex items-center gap-1 ${verdictColor}`}
          >
            <VerdictIcon className="w-3 h-3" />
            {verdictLabel}
          </div>
          <p className="text-xs text-[#6b6560] mt-1.5 leading-relaxed">
            {insights.price_explanation}
          </p>
        </div>

        {/* Quality Score */}
        <div className="bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-4 h-4 text-[#8a8280]" />
            <span className="text-[11px] text-[#6b6560] font-medium">
              Quality Score
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2.5 bg-[#e8e6e3] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  insights.quality_score >= 70
                    ? "bg-green-500"
                    : insights.quality_score >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${insights.quality_score}%` }}
              />
            </div>
            <span className="font-bold text-[#1a1a1a] text-sm">
              {insights.quality_score}/100
            </span>
          </div>
          {insights.quality_tips?.slice(0, 2).map((tip) => (
            <p key={tip} className="text-xs text-[#6b6560] leading-relaxed">
              • {tip}
            </p>
          ))}
        </div>

        {/* Demand & Timing */}
        <div className="bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-[#8a8280]" />
            <span className="text-[11px] text-[#6b6560] font-medium">
              Demand & Timing
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded-full ${demandColor}`}
            >
              {insights.demand_level?.charAt(0).toUpperCase() +
                insights.demand_level?.slice(1)}{" "}
              Demand
            </span>
          </div>
          <p className="text-xs text-[#6b6560] leading-relaxed mb-1.5">
            {insights.demand_explanation}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#666] font-medium">
            <Clock className="w-3 h-3" />
            Est. sell time: {insights.sell_time_estimate}
          </div>
        </div>
      </div>

      {/* Top tip */}
      {insights.top_tip && (
        <div className="bg-white/60 p-3.5 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-[#666]">Pro Tip: </span>
            <span className="text-xs text-[#666]">{insights.top_tip}</span>
          </div>
        </div>
      )}
    </div>
  );
}
