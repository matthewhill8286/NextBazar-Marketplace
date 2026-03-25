"use client";

import {
  Crown,
  Eye,
  Heart,
  MessageCircle,
  Package,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import { useDashboardData } from "./dashboard-context";
import ProSellerModal from "./dealer/pro-seller-modal";
import ListingsClient from "./listings/listings-client";

export default function DashboardPage() {
  const { listings: initialListings, isDealer, isProSeller } = useDashboardData();
  const [liveListings, setLiveListings] = useState(initialListings);
  const [showProModal, setShowProModal] = useState(false);
  const [dealerPrice] = useState("€25");
  const [dealerInterval] = useState("month");
  const [subscribing, setSubscribing] = useState(false);

  const handleListingsChange = useCallback(
    (updated: DashboardListing[]) => setLiveListings(updated),
    [],
  );

  const activeCount = liveListings.filter((l) => l.status === "active").length;
  const totalViews = liveListings.reduce((s, l) => s + (l.view_count || 0), 0);
  const totalFavs = liveListings.reduce((s, l) => s + (l.favorite_count || 0), 0);
  const totalMessages = liveListings.reduce(
    (s, l) => s + (l.message_count || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/post"
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Active</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Views</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalViews.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-xs font-medium text-gray-500">Saves</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalFavs.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MessageCircle className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Messages</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalMessages}
          </div>
        </div>
      </div>

      {/* Pro Seller CTA for non-dealers */}
      {FEATURE_FLAGS.DEALERS && !isDealer && (
        <button
          onClick={() => setShowProModal(true)}
          className="w-full text-left bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white hover:from-purple-700 hover:to-indigo-700 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/15 rounded-xl shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg">Become a Pro Seller</h3>
              <p className="text-white/80 text-sm mt-0.5">
                Get unlimited listings, a branded shop page, analytics &amp;
                more for just {dealerPrice}/{dealerInterval}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-white text-purple-700 font-semibold text-sm px-4 py-2 rounded-lg shrink-0 group-hover:bg-white/90 transition-colors">
              <Crown className="w-4 h-4" />
              Learn More
            </div>
          </div>
        </button>
      )}

      {/* Full listings manager — tabs, bulk actions, per-item menus */}
      <ListingsClient
        initialListings={initialListings}
        isProSeller={isProSeller}
        onListingsChange={handleListingsChange}
      />

      {/* Pro Seller modal */}
      {showProModal && (
        <ProSellerModal
          dealerPrice={dealerPrice}
          dealerInterval={dealerInterval}
          subscribing={subscribing}
          onSubscribe={async () => {
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
          onClose={() => setShowProModal(false)}
        />
      )}
    </div>
  );
}
