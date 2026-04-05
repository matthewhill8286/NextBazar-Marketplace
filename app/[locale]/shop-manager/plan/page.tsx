"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Loader2,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SELLER_PLANS, formatEur } from "@/lib/pricing-config";
import type { SellerTier } from "@/lib/pricing-config";
import { useShopCMS } from "../shop-context";

const TIER_ICONS: Record<string, typeof Star> = {
  starter: Star,
  pro: Zap,
  business: Crown,
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  starter: { bg: "bg-[#faf9f7]", text: "text-[#6b6560]", border: "border-[#e8e6e3]", accent: "#6b6560" },
  pro: { bg: "bg-[#f5f0eb]", text: "text-[#8E7A6B]", border: "border-[#d4c5b5]", accent: "#8E7A6B" },
  business: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", accent: "#d97706" },
};

export default function PlanManagementPage() {
  const { shop } = useShopCMS();
  const [changing, setChanging] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">(
    (shop?.billing_interval as "monthly" | "yearly") || "monthly",
  );

  const currentTier = (shop?.plan_tier as SellerTier) || "starter";
  const currentPlan = SELLER_PLANS.find((p) => p.key === currentTier)!;

  async function handleChangePlan(newTier: SellerTier) {
    if (newTier === currentTier && billing === shop?.billing_interval) return;
    setChanging(newTier);

    try {
      const res = await fetch("/api/dealer/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newTier, billing }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Plan change failed", {
          description: data.error || "Please try again.",
        });
        setChanging(null);
        return;
      }

      toast.success(data.message || `Switched to ${newTier}!`);
      // Reload to reflect changes
      window.location.reload();
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
      setChanging(null);
    }
  }

  async function handleSubscribe(tier: SellerTier) {
    setChanging(tier);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: window.location.origin,
          tier,
          billing,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Something went wrong", {
          description: data.error || "Could not start checkout.",
        });
        setChanging(null);
      }
    } catch {
      toast.error("Network error");
      setChanging(null);
    }
  }

  const hasSubscription = !!shop?.stripe_subscription_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#1a1a1a]">Plan & Billing</h1>
        <p className="text-sm text-[#6b6560] mt-1">
          Manage your subscription and unlock more features for your shop.
        </p>
      </div>

      {/* Current plan card */}
      <div
        className={`border-2 ${TIER_COLORS[currentTier].border} ${TIER_COLORS[currentTier].bg} p-5`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: `${TIER_COLORS[currentTier].accent}15` }}
            >
              {(() => {
                const Icon = TIER_ICONS[currentTier] || Star;
                return (
                  <Icon
                    className="w-5 h-5"
                    style={{ color: TIER_COLORS[currentTier].accent }}
                  />
                );
              })()}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">
                Current Plan: {currentPlan.name}
              </p>
              <p className="text-xs text-[#6b6560]">
                {currentPlan.monthlyAmount === 0
                  ? "Free forever"
                  : `${formatEur(billing === "yearly" ? currentPlan.yearlyMonthly : currentPlan.monthlyAmount)}/mo${billing === "yearly" ? " (billed annually)" : ""}`}
              </p>
            </div>
          </div>
          {shop?.plan_expires_at && (
            <div className="text-right">
              <p className="text-[10px] text-[#8a8280] uppercase tracking-wider font-medium">
                Next billing
              </p>
              <p className="text-xs font-medium text-[#1a1a1a]">
                {new Date(shop.plan_expires_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 bg-white border border-[#e8e6e3] p-3">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            billing === "monthly"
              ? "bg-[#2C2826] text-white"
              : "text-[#6b6560] hover:text-[#1a1a1a]"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            billing === "yearly"
              ? "bg-[#2C2826] text-white"
              : "text-[#6b6560] hover:text-[#1a1a1a]"
          }`}
        >
          Yearly
          <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            Save up to 22%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SELLER_PLANS.map((plan) => {
          const isCurrent = plan.key === currentTier;
          const isUpgrade =
            (plan.key === "pro" && currentTier === "starter") ||
            (plan.key === "business" &&
              (currentTier === "starter" || currentTier === "pro"));
          const isDowngrade =
            (plan.key === "starter" && currentTier !== "starter") ||
            (plan.key === "pro" && currentTier === "business");
          const colors = TIER_COLORS[plan.key];
          const Icon = TIER_ICONS[plan.key] || Star;
          const price =
            billing === "yearly" ? plan.yearlyMonthly : plan.monthlyAmount;

          return (
            <div
              key={plan.key}
              className={`border-2 bg-white p-5 flex flex-col relative transition-all ${
                isCurrent
                  ? `${colors.border} ring-2 ring-offset-1 ring-[#e8e6e3]`
                  : "border-[#e8e6e3] hover:border-[#ccc]"
              }`}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8E7A6B] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Current Plan
                </span>
              )}

              <div className="flex items-center gap-2 mb-3 mt-1">
                <Icon className="w-5 h-5" style={{ color: colors.accent }} />
                <h3 className="text-base font-bold text-[#1a1a1a]">
                  {plan.name}
                </h3>
              </div>

              <p className="text-xs text-[#6b6560] mb-4">{plan.tagline}</p>

              <div className="mb-4">
                <span className="text-2xl font-bold text-[#1a1a1a]">
                  {formatEur(price)}
                </span>
                {price > 0 && (
                  <span className="text-sm text-[#8a8280]">/mo</span>
                )}
                {billing === "yearly" && price > 0 && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    {formatEur(plan.yearlyAmount)} billed annually
                  </p>
                )}
              </div>

              {/* Key limits */}
              <div className="space-y-2 mb-5 flex-1">
                <div className="flex items-center gap-2 text-xs text-[#444]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {plan.limits.activeListings === "unlimited"
                    ? "Unlimited listings"
                    : `Up to ${plan.limits.activeListings} listings`}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#444]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {plan.limits.images} images per listing
                </div>
                <div className="flex items-center gap-2 text-xs text-[#444]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {plan.limits.boostsPerMonth > 0
                    ? `${plan.limits.boostsPerMonth} free boosts/month`
                    : "No free boosts"}
                </div>
                {plan.features.slice(3, 6).map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-xs text-[#444]"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Action button */}
              {isCurrent ? (
                <div className="text-center py-2.5 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200">
                  <Check className="w-4 h-4 inline mr-1" />
                  Your current plan
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() =>
                    hasSubscription
                      ? handleChangePlan(plan.key)
                      : handleSubscribe(plan.key)
                  }
                  disabled={!!changing}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-[#2C2826] hover:bg-[#3D3633] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {changing === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </button>
              ) : isDowngrade && plan.key !== "starter" ? (
                <button
                  onClick={() => handleChangePlan(plan.key)}
                  disabled={!!changing}
                  className="w-full py-2.5 text-sm font-medium text-[#6b6560] border border-[#e8e6e3] hover:bg-[#faf9f7] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {changing === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Downgrade to {plan.name}
                    </>
                  )}
                </button>
              ) : isDowngrade && plan.key === "starter" ? (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/dealer/portal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ origin: window.location.origin }),
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        toast.error(data.error || "Could not open billing portal");
                      }
                    } catch {
                      toast.error("Network error");
                    }
                  }}
                  className="w-full py-2.5 text-sm font-medium text-[#8a8280] border border-[#e8e6e3] hover:bg-[#faf9f7] transition-colors flex items-center justify-center gap-2"
                >
                  Cancel subscription
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Feature comparison */}
      <div className="bg-white border border-[#e8e6e3] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8e6e3] bg-[#faf9f7]">
          <h3 className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8E7A6B]" />
            Feature Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                <th className="text-left px-4 py-2.5 font-medium text-[#6b6560]">
                  Feature
                </th>
                {SELLER_PLANS.map((p) => (
                  <th
                    key={p.key}
                    className={`text-center px-4 py-2.5 font-semibold ${
                      p.key === currentTier
                        ? "text-[#8E7A6B] bg-[#faf9f7]"
                        : "text-[#1a1a1a]"
                    }`}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Active Listings", values: ["10", "Unlimited", "Unlimited"] },
                { label: "Images per Listing", values: ["2", "10", "20"] },
                { label: "Free Boosts/Month", values: ["0", "3", "10"] },
                { label: "Branded Shop Page", values: [false, true, true] },
                { label: "Analytics", values: [false, true, true] },
                { label: "Quick-Reply Templates", values: [false, true, true] },
                { label: "Priority Search", values: [false, true, true] },
                { label: "CSV Bulk Import", values: [false, false, true] },
                { label: "AI Descriptions", values: [false, false, true] },
                { label: "Stock Management", values: [false, false, true] },
                { label: "Video Tours", values: [false, false, true] },
                { label: "Verified Badge", values: [false, false, true] },
                { label: "Homepage Featured", values: [false, false, true] },
                { label: "Team Members", values: ["1", "1", "Up to 5"] },
                { label: "Dedicated Manager", values: [false, false, true] },
              ].map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[#f0eeeb] last:border-0"
                >
                  <td className="px-4 py-2 text-[#444] font-medium">
                    {row.label}
                  </td>
                  {row.values.map((val, i) => (
                    <td
                      key={SELLER_PLANS[i].key}
                      className={`text-center px-4 py-2 ${
                        SELLER_PLANS[i].key === currentTier ? "bg-[#faf9f7]" : ""
                      }`}
                    >
                      {typeof val === "boolean" ? (
                        val ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-[#ccc]">—</span>
                        )
                      ) : (
                        <span className="font-medium text-[#1a1a1a]">
                          {val}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing portal link */}
      <div className="text-center">
        <p className="text-xs text-[#8a8280]">
          Need to update your payment method or view invoices?{" "}
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/dealer/portal", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ origin: window.location.origin }),
                });
                const data = await res.json();
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  toast.error(data.error || "Could not open billing portal");
                }
              } catch {
                toast.error("Network error");
              }
            }}
            className="text-[#8E7A6B] hover:text-[#7A6657] font-medium underline underline-offset-2"
          >
            Open Billing Portal
          </button>
        </p>
      </div>
    </div>
  );
}
