"use client";

import {
  ArrowRight,
  Crown,
  Eye,
  Heart,
  MessageCircle,
  Package,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import { useDashboardData } from "./dashboard-context";
import ProSellerModal from "./dealer/pro-seller-modal";
import ListingsClient from "./listings/listings-client";
import ProfileNudge from "./profile-nudge";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const {
    listings: initialListings,
    isDealer,
    isProSeller,
  } = useDashboardData();
  const [liveListings, setLiveListings] = useState(initialListings);
  const [showProModal, setShowProModal] = useState(false);
  const [dealerPrice] = useState("\u20AC25");
  const [dealerInterval] = useState("month");
  const [subscribing, setSubscribing] = useState(false);

  const handleListingsChange = useCallback(
    (updated: DashboardListing[]) => setLiveListings(updated),
    [],
  );

  const activeCount = liveListings.filter((l) => l.status === "active").length;
  const totalViews = liveListings.reduce((s, l) => s + (l.view_count || 0), 0);
  const totalFavs = liveListings.reduce(
    (s, l) => s + (l.favorite_count || 0),
    0,
  );
  const totalMessages = liveListings.reduce(
    (s, l) => s + (l.message_count || 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-light text-[#1a1a1a]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t("title")}
        </h1>
        <Link
          href="/post"
          className="bg-[#8E7A6B] text-white px-5 py-2.5 text-[10px] font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-colors flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> {t("newListing")}
        </Link>
      </div>

      {/* Profile completion nudge for pro sellers missing photo/bio */}
      {isDealer && <ProfileNudge />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Package, label: t("stats.active"), value: activeCount },
          {
            icon: Eye,
            label: t("stats.views"),
            value: totalViews.toLocaleString(),
          },
          {
            icon: Heart,
            label: t("stats.saves"),
            value: totalFavs.toLocaleString(),
          },
          {
            icon: MessageCircle,
            label: t("stats.messages"),
            value: totalMessages,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-white border border-[#e8e6e3] p-5 hover:border-[#ccc] transition-colors"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 bg-[#faf9f7]">
                <Icon className="w-4 h-4 text-[#6b6560]" />
              </div>
              <span className="text-[10px] font-medium text-[#6b6560] uppercase tracking-[0.2em]">
                {label}
              </span>
            </div>
            <div
              className="text-2xl font-light text-[#1a1a1a] tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Pro Seller CTA for non-dealers */}
      {FEATURE_FLAGS.DEALERS && !isDealer && (
        <button
          onClick={() => setShowProModal(true)}
          className="w-full text-left bg-[#8E7A6B] p-6 text-white hover:bg-[#7A6657] transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/[0.08] shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-xl font-light"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("proCta.title")}
              </h3>
              <p className="text-white/50 text-sm mt-0.5">
                {t("proCta.desc", {
                  price: dealerPrice,
                  interval: dealerInterval,
                })}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 border border-white/30 text-white font-medium text-[10px] tracking-[0.15em] uppercase px-5 py-2.5 shrink-0 group-hover:bg-white/10 transition-colors">
              <Crown className="w-3.5 h-3.5" />
              {t("proCta.learnMore")}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      )}

      {/* Full listings manager — tabs, bulk actions, per-item menus */}
      <ListingsClient
        initialListings={initialListings}
        isProSeller={isProSeller}
        onListingsChangeAction={handleListingsChange}
      />

      {/* Pro Seller modal */}
      {showProModal && (
        <ProSellerModal
          dealerPrice={dealerPrice}
          dealerInterval={dealerInterval}
          subscribing={subscribing}
          onSubscribeAction={async () => {
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
          }}
          onCloseAction={() => setShowProModal(false)}
        />
      )}
    </div>
  );
}
