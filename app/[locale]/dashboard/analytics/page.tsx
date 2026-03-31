"use client";

import { BarChart2, Crown, Eye, Heart, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import ProSellerModal from "../dealer/pro-seller-modal";
import AnalyticsClient from "./analytics-client";

/* ── Skeleton helpers ─────────────────────────────────────────────────────── */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-32" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-32 hidden sm:block" />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3"
          >
            <Bone className="w-10 h-10 shrink-0" />
            <div className="space-y-2 flex-1">
              <Bone className="h-6 w-16" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left — listing list skeleton */}
        <div className="space-y-2">
          <Bone className="h-3 w-24 mb-3" />
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 border border-[#e8e6e3] bg-white"
            >
              <Bone className="w-11 h-11 shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="w-24 h-8" />
            </div>
          ))}
        </div>

        {/* Right — detail skeleton */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3">
            <Bone className="w-14 h-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-48" />
              <Bone className="h-4 w-16 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="p-4 border border-[#e8e6e3] bg-white space-y-2"
              >
                <Bone className="w-8 h-8 " />
                <Bone className="h-7 w-16" />
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-24" />
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#e8e6e3] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Bone className="h-4 w-20" />
              <Bone className="h-7 w-28 " />
            </div>
            <Bone className="h-24 w-full " />
            <div className="flex justify-between">
              <Bone className="h-3 w-16" />
              <Bone className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Blurred analytics preview for non-pro users ──────────────────────────── */

function AnalyticsLocked({
  dealerPrice,
  dealerInterval,
  subscribing,
  onSubscribeAction,
}: {
  dealerPrice: string;
  dealerInterval: string;
  subscribing: boolean;
  onSubscribeAction: () => void;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Analytics</h1>
          <p className="text-sm text-[#6b6560] mt-0.5">
            Track performance across all your listings.
          </p>
        </div>
      </div>

      {/* Blurred preview with lock overlay */}
      <div className="relative overflow-hidden">
        <div className="filter blur-[6px] pointer-events-none select-none opacity-60">
          {/* Fake summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {
                label: "Active Listings",
                icon: BarChart2,
                bg: "bg-[#f0eeeb]",
                color: "text-[#8E7A6B]",
              },
              {
                label: "Total Views",
                icon: Eye,
                bg: "bg-[#f0eeeb]",
                color: "text-[#8E7A6B]",
              },
              {
                label: "Total Saves",
                icon: Heart,
                bg: "bg-pink-50",
                color: "text-pink-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 ${s.bg} flex items-center justify-center`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1a1a1a]">—</div>
                  <div className="text-xs text-[#6b6560]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Fake listing + chart area */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white border border-[#e8e6e3]"
                />
              ))}
            </div>
            <div className="bg-white border border-[#e8e6e3] p-5">
              <div className="h-32 bg-[#faf9f7] " />
            </div>
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8e6e3] shadow-sm p-8 text-center max-w-md mx-4">
            <div className="w-14 h-14 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#8E7A6B]" />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
              Pro Seller Feature
            </h2>
            <p className="text-sm text-[#6b6560] mb-5">
              Analytics is available exclusively for Pro Sellers. Upgrade to
              unlock detailed performance insights for all your listings.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors shadow-sm"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro Seller
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ProSellerModal
          dealerPrice={dealerPrice}
          dealerInterval={dealerInterval}
          subscribing={subscribing}
          onSubscribeAction={onSubscribeAction}
          onCloseAction={() => setShowModal(false)}
          heading="Unlock Analytics"
          subheading="Upgrade to Pro Seller to access detailed performance insights, and everything else you need to grow on NextBazar."
        />
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const supabase = createClient();
  const { userId: authUserId, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProSeller, setIsProSeller] = useState(false);
  const [dealerPrice, setDealerPrice] = useState("€25");
  const [dealerInterval, setDealerInterval] = useState("month");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authUserId) {
      setLoading(false);
      return;
    }

    async function load() {
      // Check Pro Seller status
      const [{ data: profile }, { data: shop }] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_pro_seller")
          .eq("id", authUserId!)
          .single(),
        supabase
          .from("dealer_shops")
          .select("plan_status")
          .eq("user_id", authUserId!)
          .single(),
      ]);

      const isPro = !!profile?.is_pro_seller && shop?.plan_status === "active";
      setIsProSeller(isPro);

      // Fetch pricing for CTA
      if (!isPro) {
        try {
          const res = await fetch("/api/pricing");
          const pricing = await res.json();
          if (pricing?.dealer_pro) {
            setDealerPrice(pricing.dealer_pro.price);
            setDealerInterval(pricing.dealer_pro.interval);
          }
        } catch {
          // fall back to defaults
        }
      }

      // Fetch listings + analytics for pro users
      if (isPro) {
        const { data: listingData } = await supabase
          .from("listings")
          .select(
            "id, title, slug, primary_image_url, view_count, favorite_count, status, created_at",
          )
          .eq("user_id", authUserId!)
          .order("view_count", { ascending: false });

        const ids = (listingData || []).map((l: any) => l.id);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const { data: analyticsData } = ids.length
          ? await supabase
              .from("listing_analytics")
              .select("listing_id, date, views, favorites, messages")
              .in("listing_id", ids)
              .gte("date", thirtyDaysAgo)
              .order("date", { ascending: true })
          : { data: [] };

        setListings(listingData || []);
        setAnalytics(analyticsData || []);
      }

      setLoading(false);
    }

    load();
  }, [authUserId, authLoading]);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setSubscribing(false);
    }
  }

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!isProSeller) {
    return (
      <AnalyticsLocked
        dealerPrice={dealerPrice}
        dealerInterval={dealerInterval}
        subscribing={subscribing}
        onSubscribeAction={handleSubscribe}
      />
    );
  }

  return <AnalyticsClient listings={listings} analytics={analytics} />;
}
