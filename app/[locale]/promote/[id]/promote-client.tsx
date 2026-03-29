"use client";

import { ArrowLeft, Check, Loader2, Star, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StripeCheckoutModal from "@/app/components/stripe-checkout-modal";
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
  const PROMOTIONS = buildPromotions(pricing);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select(
          "id, title, slug, primary_image_url, price, currency, is_promoted, is_urgent",
        )
        .eq("id", listingId)
        .single();

      if (!data) {
        router.push("/dashboard/listings");
        return;
      }
      setListing(data);
      setLoading(false);
    }
    load();
  }, [listingId, router.push, supabase.from]);

  function handleCheckout(promotionType: string) {
    setSelected(promotionType);
    setCheckoutOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#999] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/listings"
          className="p-2 hover:bg-[#f0eeeb] transition-colors text-[#999]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">
            Boost Your Listing
          </h1>
          <p className="text-sm text-[#999]">
            Get more visibility and sell faster
          </p>
        </div>
      </div>

      {/* Listing preview */}
      {listing && (
        <div className="bg-white border border-[#e8e6e3] p-4 mb-8 flex items-center gap-4">
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
            <p className="text-xs text-[#999]">
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
                    : "border-[#e8e6e3] bg-white hover:border-[#e8e6e3]"
              }`}
            >
              {promo.popular && !alreadyActive && (
                <span className="absolute -top-2.5 right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Most Popular
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
                    <p className="text-xs text-[#999]">{promo.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#1a1a1a]">
                    {promo.price}
                  </p>
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

      {/* Checkout button */}
      <button
        onClick={() => handleCheckout(selected)}
        className="w-full bg-[#2C2826] text-white py-4 font-semibold text-lg hover:bg-[#3D3633] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#e8e6e3]"
      >
        Pay Now — {PROMOTIONS.find((p) => p.key === selected)?.price}
      </button>

      <p className="text-center text-xs text-[#bbb] mt-3">
        Secure payment powered by Stripe. You won&apos;t be charged until you
        confirm.
      </p>

      {/* Embedded Stripe checkout modal */}
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
