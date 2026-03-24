"use client";

import { Check, Package, Search, Store } from "lucide-react";
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

interface ShopsClientProps {
  shops: ShopCardRow[];
}

export default function ShopsClient({ shops }: ShopsClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return shops;
    const q = search.toLowerCase();
    return shops.filter(
      (s) =>
        s.shop_name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [shops, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              <Store className="w-3.5 h-3.5" />
              Dealer Shops
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Browse Shops
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Discover verified dealer shops from across Cyprus. Each shop is
              run by a trusted, premium seller.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Shop Grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🏪</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {search.trim() ? "No shops found" : "No shops yet"}
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
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
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Banner */}
      <div
        className="relative h-32 w-full overflow-hidden"
        style={{
          backgroundImage: shop.banner_url
            ? `url(${shop.banner_url})`
            : `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {shop.banner_url && <div className="absolute inset-0 bg-black/10" />}

        {/* Logo overlay */}
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-3 border-white shadow-md bg-white">
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
                style={{ backgroundColor: gradientStart }}
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
              style={{ backgroundColor: gradientStart }}
              title="Verified Dealer"
            >
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Description */}
        {shop.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {shop.description}
          </p>
        )}

        {/* Footer stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Package className="w-3.5 h-3.5" />
            {shop.listing_count}{" "}
            {shop.listing_count === 1 ? "listing" : "listings"}
          </span>
          <span>
            Joined{" "}
            {new Date(shop.created_at).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
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
                style={{ backgroundColor: gradientStart }}
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
              style={{ backgroundColor: gradientStart }}
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
