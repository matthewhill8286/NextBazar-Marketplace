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
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import type { SellerTier } from "@/lib/pricing-config";
import { formatEur, SELLER_PLANS, yearlySavings } from "@/lib/pricing-config";

type BillingCycle = "monthly" | "yearly";

const TIER_ICONS: Record<SellerTier, React.ElementType> = {
  starter: Star,
  pro: Crown,
  business: Sparkles,
};

export default function PlanSelector() {
  const router = useRouter();
  const { userId } = useAuth();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [subscribing, setSubscribing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SellerTier | null>(null);

  async function handleSubscribe(tier: SellerTier) {
    if (!userId) {
      router.push("/auth/signup?redirect=/pro-sellers");
      return;
    }

    setSubscribing(true);
    setSelectedTier(tier);
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
      const { url, error } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        console.error("Subscribe error:", error);
        setSubscribing(false);
        setSelectedTier(null);
      }
    } catch {
      setSubscribing(false);
      setSelectedTier(null);
    }
  }

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-5 py-2.5 text-sm font-medium transition-all ${
            billing === "monthly"
              ? "bg-[#1a1a1a] text-white"
              : "bg-white text-[#6b6560] hover:text-[#1a1a1a] border border-[#e8e6e3]"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`px-5 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
            billing === "yearly"
              ? "bg-[#1a1a1a] text-white"
              : "bg-white text-[#6b6560] hover:text-[#1a1a1a] border border-[#e8e6e3]"
          }`}
        >
          Yearly
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 font-semibold">
            SAVE UP TO 22%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              className={`relative bg-white border p-7 flex flex-col ${
                plan.popular
                  ? "border-[#8E7A6B] shadow-lg shadow-[#8E7A6B]/10 scale-[1.02]"
                  : "border-[#e8e6e3]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8E7A6B] text-white text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-1">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[#8E7A6B]" />
                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                  {plan.name}
                </h3>
              </div>
              <p className="text-xs text-[#8a8280] mb-5">{plan.tagline}</p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-bold text-[#1a1a1a]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {formatEur(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-[#8a8280]">/mo</span>
                  )}
                </div>
                {billing === "yearly" && savings > 0 && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Save {savings}% &middot; {formatEur(plan.yearlyAmount)}
                    /year
                  </p>
                )}
                {billing === "yearly" && plan.yearlyAmount > 0 && (
                  <p className="text-xs text-[#8a8280] mt-0.5">
                    Billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-[#444]"
                  >
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
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
                  onClick={() => handleSubscribe(plan.key)}
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
    </div>
  );
}
