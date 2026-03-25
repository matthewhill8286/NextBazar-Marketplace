"use client";

import {
  ArrowRight,
  Check,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ShopCardRow } from "@/lib/supabase/queries";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** Darken or lighten a hex colour by `percent` (-100..100). */
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

type SortOption = "listings" | "newest" | "name";

interface ShopsClientProps {
  shops: ShopCardRow[];
}

export default function ShopsClient({ shops }: ShopsClientProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("listings");

  const filtered = useMemo(() => {
    let result = [...shops];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.shop_name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)),
      );
    }

    switch (sort) {
      case "listings":
        result.sort((a, b) => b.listing_count - a.listing_count);
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        break;
      case "name":
        result.sort((a, b) => a.shop_name.localeCompare(b.shop_name));
        break;
    }

    return result;
  }, [shops, search, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.15) 0%, transparent 40%)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Store className="w-3.5 h-3.5" />
              Verified Pro Sellers
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Browse Shops
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-8">
              Discover trusted Pro Seller shops from across Cyprus. Each shop is
              run by a verified, premium seller.
            </p>

            {/* Search bar */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search shops by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-0 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/20 transition-all shadow-lg shadow-indigo-900/20"
              />
            </div>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-8 md:h-12"
            preserveAspectRatio="none"
          >
            <path d="M0 60L1440 60L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 60Z" fill="#f9fafb" />
          </svg>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "shop" : "shops"} found
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 cursor-pointer"
          >
            <option value="listings">Most Listings</option>
            <option value="newest">Newest</option>
            <option value="name">A — Z</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {search.trim() ? "No shops found" : "No shops yet"}
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              {search.trim()
                ? "Try a different search term."
                : "Be the first to open a dealer shop on NextBazar!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Individual Shop Card ─────────────────────────────────────────────────── */

function ShopCard({ shop }: { shop: ShopCardRow }) {
  const accentColor = shop.accent_color || "#4f46e5";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(accentColor);
  const gradientStart = isValidHex ? accentColor : "#4f46e5";
  const gradientEnd = isValidHex
    ? adjustBrightness(accentColor, -25)
    : "#4338ca";

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Banner */}
      <div
        className="relative h-36 w-full overflow-hidden"
        style={{
          backgroundImage: shop.banner_url
            ? `url(${shop.banner_url})`
            : `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {shop.banner_url && <div className="absolute inset-0 bg-black/10" />}
        {!shop.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
              }}
            />
          </div>
        )}

        {/* Listing count badge on banner */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
            <Package className="w-3 h-3" />
            {shop.listing_count}
          </span>
        </div>

        {/* Logo overlay */}
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-[3px] border-white shadow-md bg-white">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.shop_name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
                style={{
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                }}
              >
                {getInitials(shop.shop_name)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-5 px-5">
        {/* Name + verified */}
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {shop.shop_name}
          </h3>
          {shop.profile?.verified && (
            <span
              className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white"
              style={{
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              }}
              title="Verified Pro Seller"
            >
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Description */}
        {shop.description ? (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {shop.description}
          </p>
        ) : (
          <div className="mb-4" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="font-medium">
              {shop.listing_count}{" "}
              {shop.listing_count === 1 ? "listing" : "listings"}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>
              Joined{" "}
              {new Date(shop.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

/* ── Compact card for homepage featured section ───────────────────────────── */

export function ShopCardCompact({ shop }: { shop: ShopCardRow }) {
  const accentColor = shop.accent_color || "#4f46e5";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(accentColor);
  const gradientStart = isValidHex ? accentColor : "#4f46e5";
  const gradientEnd = isValidHex
    ? adjustBrightness(accentColor, -25)
    : "#4338ca";

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Mini banner */}
      <div
        className="relative h-20 w-full"
        style={{
          backgroundImage: shop.banner_url
            ? `url(${shop.banner_url})`
            : `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {shop.banner_url && <div className="absolute inset-0 bg-black/10" />}
      </div>

      {/* Content */}
      <div className="relative px-4 pb-4 pt-7">
        {/* Logo */}
        <div className="absolute -top-6 left-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-white">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.shop_name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                }}
              >
                {getInitials(shop.shop_name)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
            {shop.shop_name}
          </h3>
          {shop.profile?.verified && (
            <span
              className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full text-white"
              style={{
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              }}
            >
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <Package className="w-3 h-3" />
          {shop.listing_count}{" "}
          {shop.listing_count === 1 ? "listing" : "listings"}
        </div>
      </div>
    </Link>
  );
}
