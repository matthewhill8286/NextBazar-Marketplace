"use client";

import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import StripeCheckoutModal from "@/app/components/stripe-checkout-modal";
import { Link, useRouter } from "@/i18n/navigation";
import { getPlanLimits } from "@/lib/plan-limits";
import type { ClientPricing } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";

function buildPromotions(pricing: ClientPricing) {
  return [
    {
      key: "featured",
      name: pricing.featured.name,
      icon: Star,
      price: pricing.featured.price,
      duration: `${pricing.featured.duration} days`,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 border-amber-200",
      popular: true,
      benefits: [
        "Top placement in search results",
        "Highlighted with Featured badge",
        "Shown on homepage featured section",
        "Up to 5x more views",
      ],
    },
    {
      key: "urgent",
      name: pricing.urgent.name,
      icon: Zap,
      price: pricing.urgent.price,
      duration: `${pricing.urgent.duration} days`,
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50 border-red-200",
      popular: false,
      benefits: [
        "Boost badge on your listing",
        "Priority in search results",
        "Stand out from the crowd",
        "Up to 3x more views",
      ],
    },
  ];
}

export default function PromoteClient({
  listingId,
  pricing,
}: {
  listingId: string;
  pricing: ClientPricing;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("featured");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activating, setActivating] = useState(false);

  // Plan-based free boost state
  const [planTier, setPlanTier] = useState<string>("starter");
  const [activePromoCount, setActivePromoCount] = useState(0);
  const [cycleStart, setCycleStart] = useState<string | null>(null);
  const PROMOTIONS = buildPromotions(pricing);

  const limits = getPlanLimits(planTier);
  const freeBoostsTotal = limits.freeBoostsPerMonth;
  const freeBoostsRemaining = Math.max(freeBoostsTotal - activePromoCount, 0);
  const hasFreeBoosts = freeBoostsRemaining > 0;

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Fetch listing and shop tier in parallel
      const [{ data: listingData }, { data: shopData }] = await Promise.all([
        supabase
          .from("listings")
          .select(
            "id, title, slug, primary_image_url, price, currency, is_promoted, is_urgent, user_id",
          )
          .eq("id", listingId)
          .single(),
        supabase
          .from("dealer_shops")
          .select("plan_tier, plan_started_at, plan_expires_at")
          .eq("user_id", user.id)
          .eq("plan_status", "active")
          .single(),
      ]);

      if (!listingData) {
        router.push("/dashboard/listings");
        return;
      }

      setListing(listingData);
      if (shopData?.plan_tier) setPlanTier(shopData.plan_tier);

      // Count currently active boosts
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_promoted", true);
      setActivePromoCount(count ?? 0);

      setLoading(false);
    }
    load();
  }, [listingId, router.push, supabase]);

  async function handleFreeBoost() {
    if (!listing || activating) return;
    setActivating(true);
    try {
      const boostType = selected;
      const updates: Record<string, any> = {};
      const now = new Date();

      if (boostType === "featured") {
        const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updates.is_promoted = true;
        updates.promoted_until = until.toISOString();
      } else {
        const until = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        updates.is_urgent = true;
        updates.boosted_until = until.toISOString();
      }

      const { error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", listing.id);

      if (error) throw error;

      toast.success(
        boostType === "featured"
          ? "Listing featured for 7 days!"
          : "Quick boost activated for 3 days!",
      );
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Failed to activate boost. Please try again.");
    }
    setActivating(false);
  }

  function handleCheckout(promotionType: string) {
    setSelected(promotionType);
    setCheckoutOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6b6560] animate-spin" />
      </div>
    );
  }

  const selectedPromo = PROMOTIONS.find((p) => p.key === selected);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/listings"
          className="p-2 hover:bg-[#f0eeeb] transition-colors text-[#6b6560]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            Boost Your Listing
          </h1>
          <p className="text-sm text-[#6b6560]">
            Get more visibility and sell faster
          </p>
        </div>
      </div>

      {/* Listing preview */}
      {listing && (
        <div className="bg-white border border-[#e8e6e3] p-4 mb-6 flex items-center gap-4">
          {listing.primary_image_url && (
            <div className="w-16 h-12 overflow-hidden bg-[#f0eeeb] shrink-0 relative">
              <Image
                src={listing.primary_image_url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#1a1a1a] text-sm truncate">
              {listing.title}
            </p>
            <p className="text-xs text-[#6b6560]">
              {listing.price
                ? `${listing.currency === "EUR" ? "€" : listing.currency}${listing.price.toLocaleString()}`
                : "Contact for price"}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {listing.is_promoted && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                Featured
              </span>
            )}
            {listing.is_urgent && (
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                Urgent
              </span>
            )}
          </div>
        </div>
      )}

      {/* Free boosts banner — shown for Pro/Business with remaining boosts */}
      {hasFreeBoosts && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 mb-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
            <Crown className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900">
              {freeBoostsRemaining} free boost
              {freeBoostsRemaining !== 1 ? "s" : ""} included with your{" "}
              {limits.tierLabel} plan
            </p>
            <p className="text-xs text-emerald-700">
              You&apos;ve used {activePromoCount} of {freeBoostsTotal} free
              monthly boosts. Select an option below to activate instantly.
            </p>
          </div>
        </div>
      )}

      {/* Stats callout */}
      <div className="bg-[#faf9f7] p-5 border border-[#e8e6e3] mb-8">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-[#666]" />
          <span className="font-semibold text-[#1a1a1a]">
            Promoted listings get up to 5x more views
          </span>
        </div>
        <p className="text-sm text-[#666]">
          Stand out from the crowd and reach more buyers. Promoted listings
          appear at the top of search results and on the homepage.
        </p>
      </div>

      {/* Promotion options */}
      <div className="space-y-4 mb-8">
        {PROMOTIONS.map((promo) => {
          const isSelected = selected === promo.key;
          const alreadyActive =
            (promo.key === "featured" && listing?.is_promoted) ||
            (promo.key === "urgent" && listing?.is_urgent);

          return (
            <button
              key={promo.key}
              type="button"
              onClick={() => !alreadyActive && setSelected(promo.key)}
              disabled={alreadyActive}
              className={`w-full text-left border-2 p-5 transition-all relative ${
                alreadyActive
                  ? "border-[#e8e6e3] bg-[#faf9f7] opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "border-[#999] bg-[#faf9f7]/50 ring-2 ring-[#e8e6e3]"
                    : "border-[#e8e6e3] bg-white hover:border-[#ccc]"
              }`}
            >
              {promo.popular && !alreadyActive && !hasFreeBoosts && (
                <span className="absolute -top-2.5 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              {hasFreeBoosts && !alreadyActive && (
                <span className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Free with {limits.tierLabel}
                </span>
              )}
              {alreadyActive && (
                <span className="absolute -top-2.5 right-4 bg-green-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Already Active
                </span>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${promo.color} flex items-center justify-center text-white`}
                  >
                    <promo.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">{promo.name}</p>
                    <p className="text-xs text-[#6b6560]">{promo.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  {hasFreeBoosts && !alreadyActive ? (
                    <div>
                      <p className="text-xl font-bold text-emerald-600">Free</p>
                      <p className="text-[10px] text-[#8a8280] line-through">
                        {promo.price}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-[#1a1a1a]">
                      {promo.price}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {promo.benefits.map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-1.5 text-xs text-[#666]"
                  >
                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                    {b}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Checkout / Activate button */}
      {hasFreeBoosts ? (
        <button
          onClick={handleFreeBoost}
          disabled={
            activating ||
            (selected === "featured" && listing?.is_promoted) ||
            (selected === "urgent" && listing?.is_urgent)
          }
          className="w-full bg-emerald-600 text-white py-4 font-semibold text-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Activating…
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Activate Free Boost
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                {freeBoostsRemaining} remaining
              </span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => handleCheckout(selected)}
          className="w-full bg-[#2C2826] text-white py-4 font-semibold text-lg hover:bg-[#3D3633] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#e8e6e3]"
        >
          Pay Now — {selectedPromo?.price}
        </button>
      )}

      <p className="text-center text-xs text-[#8a8280] mt-3">
        {hasFreeBoosts
          ? `Boosts are included in your ${limits.tierLabel} plan — no payment needed.`
          : "Secure payment powered by Stripe. You won't be charged until you confirm."}
      </p>

      {/* Embedded Stripe checkout modal — only for paid boosts */}
      {checkoutOpen && listing && (
        <StripeCheckoutModal
          listingId={listing.id}
          promotionType={selected as "featured" | "urgent"}
          pricing={pricing}
          onCloseAction={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
