"use client";

import {
  BarChart2,
  Check,
  Copy,
  CreditCard,
  Crown,
  Edit3,
  ExternalLink,
  Eye,
  Globe,
  Heart,
  Loader2,
  MessageCircle,
  Palette,
  Plus,
  Save,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type DealerShop = Tables<"dealer_shops">;

type ListingRow = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  status: string;
  view_count: number;
  favorite_count: number;
  message_count: number;
  primary_image_url: string | null;
  created_at: string;
  is_promoted: boolean;
};

type Props = {
  shop: DealerShop | null;
  profile: { display_name: string | null; is_dealer: boolean } | null;
  listings: ListingRow[];
  userId: string;
  userEmail: string;
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "branding" | "inventory";

export default function DealerDashboardClient({
  shop,
  profile,
  listings,
  userId,
  userEmail,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [subscribing, setSubscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ─── Post-checkout verification ─────────────────────────────────────────────
  useEffect(() => {
    const isSetup = searchParams.get("setup") === "true";
    const sessionId = searchParams.get("session_id");

    if (isSetup && sessionId && !shop?.plan_status) {
      setVerifying(true);
      fetch("/api/dealer/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "activated" || data.status === "already_active") {
            router.refresh();
          }
        })
        .catch((err) => {
          console.error("Failed to verify dealer session:", err);
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, shop?.plan_status, router]);
  const [copied, setCopied] = useState(false);

  // Branding form state
  const [shopName, setShopName] = useState(shop?.shop_name ?? "");
  const [slug, setSlug] = useState(shop?.slug ?? "");
  const [description, setDescription] = useState(shop?.description ?? "");
  const [accentColor, setAccentColor] = useState(
    shop?.accent_color ?? "#4f46e5",
  );
  const [website, setWebsite] = useState(shop?.website ?? "");
  const [facebook, setFacebook] = useState(shop?.facebook ?? "");
  const [instagram, setInstagram] = useState(shop?.instagram ?? "");

  const isActive = shop?.plan_status === "active";

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const activeListings = listings.filter((l) => l.status === "active");
  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalFavorites = listings.reduce((s, l) => s + l.favorite_count, 0);
  const totalMessages = listings.reduce((s, l) => s + l.message_count, 0);

  // ─── Subscribe ─────────────────────────────────────────────────────────────
  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setSubscribing(false);
    }
  }

  // ─── Manage billing ────────────────────────────────────────────────────────
  async function handleManageBilling() {
    const res = await fetch("/api/dealer/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: window.location.origin }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  // ─── Save branding ────────────────────────────────────────────────────────
  async function handleSaveBranding() {
    if (!shop) return;
    setSaving(true);
    await supabase
      .from("dealer_shops")
      .update({
        shop_name: shopName,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description,
        accent_color: accentColor,
        website: website || null,
        facebook: facebook || null,
        instagram: instagram || null,
      })
      .eq("id", shop.id);
    setSaving(false);
    router.refresh();
  }

  // ─── Bulk status change ─────────────────────────────────────────────────────
  async function bulkUpdateStatus(ids: string[], status: string) {
    for (const id of ids) {
      await supabase.from("listings").update({ status }).eq("id", id);
    }
    router.refresh();
  }

  function copyShopUrl() {
    const url = `${window.location.origin}/shop/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Verifying post-checkout — show spinner ──────────────────────────────
  if (verifying) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Setting up your Pro Seller account...
        </h2>
        <p className="text-gray-500">This only takes a moment.</p>
      </div>
    );
  }

  // ─── Not subscribed — show CTA ────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white text-center">
          {/* Decorative bg */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)",
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Sellers Pro</h1>
            <p className="text-white/75 text-lg mb-2 max-w-md mx-auto">
              Everything you need to grow your business on NextBazar.
            </p>
            <div className="text-4xl font-extrabold my-6">
              &euro;35
              <span className="text-lg font-medium text-white/50">/month</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-md mx-auto">
              {[
                "Unlimited listings",
                "Branded shop page",
                "Custom logo & banner",
                "Accent colour theming",
                "Verified Pro Seller badge",
                "Analytics dashboard",
                "Inventory management",
                "Bulk edit tools",
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-white/90"
                >
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-300" />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-black/10 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {subscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active dealer dashboard ───────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700",
      sold: "bg-gray-100 text-gray-500",
      draft: "bg-amber-50 text-amber-700",
      paused: "bg-orange-50 text-orange-600",
      removed: "bg-red-50 text-red-600",
    };
    return styles[status] || "bg-gray-100 text-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Shop icon with accent */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}25)`,
            }}
          >
            <Store className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {shopName || "Your Shop"}
            </h1>
            <p className="text-sm text-gray-500">
              Sellers Pro &mdash; manage your brand, listings, and analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Shop
          </Link>
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(
          [
            { key: "overview", label: "Overview", icon: BarChart2 },
            { key: "branding", label: "Branding", icon: Palette },
            { key: "inventory", label: "Inventory", icon: ShoppingBag },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Active Listings",
                value: activeListings.length,
                icon: ShoppingBag,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Total Views",
                value: totalViews.toLocaleString(),
                icon: Eye,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Total Favorites",
                value: totalFavorites.toLocaleString(),
                icon: Heart,
                color: "text-rose-600",
                bg: "bg-rose-50",
              },
              {
                label: "Messages",
                value: totalMessages.toLocaleString(),
                icon: MessageCircle,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div
                  className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}
                >
                  <s.icon className={`w-[18px] h-[18px] ${s.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {s.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Shop URL */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Your Shop URL
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-mono truncate border border-gray-100">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /shop/{slug}
              </div>
              <button
                onClick={copyShopUrl}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Top performing listings */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              Top Performing Listings
            </h3>
            <div className="space-y-2">
              {activeListings
                .sort((a, b) => b.view_count - a.view_count)
                .slice(0, 5)
                .map((l, i) => (
                  <Link
                    key={l.id}
                    href={`/listing/${l.slug}`}
                    className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-xs font-semibold text-gray-300 w-5 text-center">
                      {i + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {l.primary_image_url && (
                        <img
                          src={l.primary_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {l.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {l.view_count} views &middot; {l.favorite_count} saves
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      &euro;{l.price?.toLocaleString() ?? "&mdash;"}
                    </div>
                  </Link>
                ))}
              {activeListings.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  No listings yet
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Branding Tab ────────────────────────────────────────────────── */}
      {tab === "branding" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Shop Branding
            </h3>
            <p className="text-sm text-gray-500">
              Customise how your shop appears to buyers.
            </p>
          </div>

          {/* Live preview strip */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${
                /^#[0-9A-Fa-f]{6}$/.test(accentColor)
                  ? (
                      () => {
                        const num = parseInt(accentColor.replace("#", ""), 16);
                        const amt = Math.round(2.55 * -25);
                        const clamp = (v: number) =>
                          Math.max(0, Math.min(255, v));
                        const R = clamp((num >> 16) + amt);
                        const G = clamp(((num >> 8) & 0xff) + amt);
                        const B = clamp((num & 0xff) + amt);
                        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
                      }
                    )()
                  : "#4338ca"
              })`,
            }}
          >
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {shopName
                  ? shopName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "?"}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">
                  {shopName || "Your Shop"}
                </div>
                <div className="text-white/60 text-xs">
                  /shop/{slug || "..."}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Shop Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Elite Motors"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Shop URL Slug
              </label>
              <div className="flex items-center gap-0">
                <span className="bg-gray-50 border border-r-0 border-gray-200 px-3 py-3 rounded-l-xl text-xs text-gray-400">
                  /shop/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    )
                  }
                  placeholder="elite-motors"
                  className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Accent Colour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Website{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Shop Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell buyers about your business, specialities, opening hours..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Facebook
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourpage"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleSaveBranding}
            disabled={saving || !shopName || !slug}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-200"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      )}

      {/* ── Inventory Tab ───────────────────────────────────────────────── */}
      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              All Listings ({listings.length})
            </h3>
            <Link
              href="/post"
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              New Listing
            </Link>
          </div>

          {/* Bulk actions */}
          <div className="flex gap-2">
            <button
              onClick={() =>
                bulkUpdateStatus(
                  listings.filter((l) => l.status === "draft").map((l) => l.id),
                  "active",
                )
              }
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Activate All Drafts
            </button>
            <button
              onClick={() =>
                bulkUpdateStatus(
                  listings
                    .filter((l) => l.status === "active")
                    .map((l) => l.id),
                  "paused",
                )
              }
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Pause All Active
            </button>
          </div>

          {/* Listings table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Listing
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Price
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                    Views
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                    Saves
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {l.primary_image_url && (
                            <img
                              src={l.primary_image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">
                          {l.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusBadge(l.status)}`}
                      >
                        {l.status}
                      </span>
                      {l.is_promoted && (
                        <span className="ml-1.5 text-[10px] font-semibold text-amber-600">
                          &#10022;
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {l.price != null
                        ? `\u20AC${l.price.toLocaleString()}`
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                      {l.view_count}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                      {l.favorite_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/edit/${l.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listings.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No listings yet</p>
                <p className="text-xs mt-1">
                  <Link
                    href="/post"
                    className="text-indigo-600 hover:underline"
                  >
                    Create your first listing
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
