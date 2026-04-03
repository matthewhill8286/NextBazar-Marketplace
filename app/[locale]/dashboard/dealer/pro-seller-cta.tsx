"use client";

import {
  ArrowRight,
  Check,
  Crown,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  SELLER_PLANS,
  formatEur,
  yearlySavings,
} from "@/lib/pricing-config";
import type { SellerTier } from "@/lib/pricing-config";

type BillingCycle = "monthly" | "yearly";

type Props = {
  /** @deprecated kept for backward compat — ignored in multi-plan UI */
  dealerPrice?: string;
  /** @deprecated kept for backward compat — ignored in multi-plan UI */
  dealerInterval?: string;
  subscribing: boolean;
  onSubscribeAction: (tier: SellerTier, billing: BillingCycle) => void;
};

const TIER_ICONS: Record<SellerTier, React.ElementType> = {
  starter: Star,
  pro: Crown,
  business: Sparkles,
};

export default function ProSellerCTA({
  subscribing,
  onSubscribeAction,
}: Props) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedTier, setSelectedTier] = useState<SellerTier | null>(null);

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="bg-[#2C2826] p-8 md:p-10 text-white text-center mb-0">
        <div className="w-14 h-14 bg-[#8E7A6B] flex items-center justify-center mx-auto mb-5">
          <Crown className="w-7 h-7" />
        </div>
        <h1
          className="text-3xl font-light mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Choose your seller plan
        </h1>
        <p className="text-white/50 text-base max-w-lg mx-auto">
          Start free and upgrade as you grow. All paid plans include a 14-day
          money-back guarantee.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-white text-[#1a1a1a]"
                : "bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
              billing === "yearly"
                ? "bg-white text-[#1a1a1a]"
                : "bg-white/10 text-white/60 hover:text-white"
            }`}
          >
            Yearly
            <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 font-semibold">
              SAVE UP TO 22%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#e8e6e3] border-t-0">
        {SELLER_PLANS.map((plan) => {
          const Icon = TIER_ICONS[plan.key];
          const price =
            billing === "monthly" ? plan.monthlyAmount : plan.yearlyMonthly;
          const savings = yearlySavings(plan.monthlyAmount, plan.yearlyAmount);
          const isLoading = subscribing && selectedTier === plan.key;
          const isFree = plan.key === "starter";

          return (
            <div
              key={plan.key}
              className={`relative bg-white p-6 flex flex-col border-r border-[#e8e6e3] last:border-r-0 ${
                plan.popular ? "bg-[#faf8f6]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-0 left-0 right-0 h-1 bg-[#8E7A6B]" />
              )}
              {plan.popular && (
                <span className="inline-block text-[10px] font-bold tracking-[0.15em] uppercase text-[#8E7A6B] mb-3">
                  Most Popular
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[#8E7A6B]" />
                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  {plan.name}
                </h3>
              </div>
              <p className="text-xs text-[#8a8280] mb-4">{plan.tagline}</p>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#1a1a1a]">
                    {formatEur(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-[#8a8280]">/mo</span>
                  )}
                </div>
                {billing === "yearly" && savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Save {savings}% &middot; {formatEur(plan.yearlyAmount)}/year
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[#444]"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isFree ? (
                <Link
                  href="/post"
                  className="block text-center py-3 text-sm font-semibold bg-[#f0eeeb] text-[#1a1a1a] hover:bg-[#e8e6e3] transition-colors"
                >
                  Start listing for free
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTier(plan.key);
                    onSubscribeAction(plan.key, billing);
                  }}
                  disabled={subscribing}
                  className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    plan.popular
                      ? "bg-[#8E7A6B] text-white hover:bg-[#7A6657]"
                      : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Get {plan.name}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Trust strip */}
      <div className="flex items-center justify-center gap-6 py-5 text-xs text-[#8a8280] bg-[#faf9f7] border border-t-0 border-[#e8e6e3]">
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          14-day money-back guarantee
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          Cancel anytime
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          Secure Stripe payments
        </span>
      </div>
    </div>
  );
}
