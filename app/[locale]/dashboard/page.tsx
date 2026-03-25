"use client";

import {
  Crown,
  Eye,
  Heart,
  MessageCircle,
  Package,
  Plus,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/client";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import { LoadingSpinner } from "@/app/components/ui";
import ListingsClient from "./listings/listings-client";
import MyShopTab from "./my-shop-tab";

type DashboardView = "overview" | "my-shop";

export default function DashboardPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDealer, setIsDealer] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Allow linking directly to the shop tab via ?view=my-shop
  const initialView =
    searchParams.get("view") === "my-shop" ? "my-shop" : "overview";
  const [view, setView] = useState<DashboardView>(initialView);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const [{ data }, { data: profile }] = await Promise.all([
        supabase
          .from("listings")
          .select(
            `
            id, title, slug, price, currency, price_type, condition, status,
            primary_image_url, view_count, favorite_count, message_count,
            is_promoted, is_urgent, created_at, expires_at,
            category_id, location_id,
            categories(name, slug, icon),
            locations(name)
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("is_dealer")
          .eq("id", user.id)
          .single(),
      ]);

      setListings(data || []);
      setIsDealer(profile?.is_dealer || false);
      setLoading(false);
    }
    load();
  }, []);

  const totalViews = listings.reduce((s, l) => s + (l.view_count || 0), 0);
  const totalFavs = listings.reduce((s, l) => s + (l.favorite_count || 0), 0);
  const totalMessages = listings.reduce(
    (s, l) => s + (l.message_count || 0),
    0,
  );

  if (loading) {
    return <LoadingSpinner />;
  }

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

      {/* View switcher for Pro Sellers */}
      {FEATURE_FLAGS.DEALERS && isDealer && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setView("overview")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              view === "overview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setView("my-shop")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              view === "my-shop"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Store className="w-4 h-4" />
            My Shop
          </button>
        </div>
      )}

      {/* ── My Shop view ────────────────────────────────────────────────── */}
      {view === "my-shop" && userId && <MyShopTab userId={userId} />}

      {/* ── Overview view ───────────────────────────────────────────────── */}
      {view === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  Active
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {listings.filter((l) => l.status === "active").length}
              </div>
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
                <span className="text-xs font-medium text-gray-500">
                  Messages
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalMessages}
              </div>
            </div>
          </div>

          {/* Pro Seller CTA for non-dealers */}
          {FEATURE_FLAGS.DEALERS && !isDealer && (
            <button
              onClick={() => setView("my-shop")}
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
                    more for just €35/month
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-white text-purple-700 font-semibold text-sm px-4 py-2 rounded-lg shrink-0 group-hover:bg-white/90 transition-colors">
                  <Store className="w-4 h-4" />
                  Learn More
                </div>
              </div>
            </button>
          )}

          {/* Full listings manager — tabs, bulk actions, per-item menus */}
          <ListingsClient initialListings={listings} />
        </>
      )}
    </div>
  );
}
