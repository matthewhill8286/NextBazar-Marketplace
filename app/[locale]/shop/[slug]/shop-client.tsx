"use client";

import {
  Calendar,
  Check,
  Facebook,
  Globe,
  Grid3X3,
  Instagram,
  Music,
  Package,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import type { Tables } from "@/lib/supabase/database.types";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

type DealerShop = Omit<
  Tables<"dealer_shops">,
  "stripe_customer_id" | "stripe_subscription_id"
>;

type ShopProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  is_pro_seller: boolean;
  created_at: string;
};

interface ShopClientProps {
  shop: DealerShop;
  listings: ListingCardRow[];
  profile: ShopProfile | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
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

/** Convert hex to rgb components. */
function hexToRgb(hex: string): string {
  const num = parseInt(hex.replace("#", ""), 16);
  return `${(num >> 16) & 0xff}, ${(num >> 8) & 0xff}, ${num & 0xff}`;
}

type SortOption = "newest" | "price-low" | "price-high" | "popular";

export default function ShopClient({
  shop,
  listings,
  profile,
}: ShopClientProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [copied, setCopied] = useState(false);

  const planTier = (shop.plan_tier as "starter" | "pro" | "business") || "pro";
  const isBusiness = planTier === "business";

  const accentColor = shop.accent_color || "#8E7A6B";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(accentColor);
  const gradientStart = isValidHex ? accentColor : "#8E7A6B";
  const gradientEnd = isValidHex
    ? adjustBrightness(accentColor, -25)
    : "#7A6657";

  const badgeLabel = isBusiness
    ? "Verified Business Seller"
    : "Verified Pro Seller";
  const badgeGradient = isBusiness
    ? "linear-gradient(135deg, #b45309, #92400e)"
    : `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
  const statusLabel = isBusiness ? "BUSINESS" : "PRO";
  const statusColor = isBusiness ? "#b45309" : gradientStart;
  const accentRgb = isValidHex ? hexToRgb(accentColor) : "142, 122, 107";

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "";
    return formatDate(profile.created_at);
  }, [profile?.created_at]);

  const promotedCount = listings.filter((l) => l.is_promoted).length;

  const filtered = useMemo(() => {
    let result = [...listings];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(q));
    }

    // Sort
    switch (sort) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "price-low":
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "popular":
        result.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
        break;
    }

    return result;
  }, [listings, search, sort]);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: shop.shop_name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative">
        {shop.banner_url ? (
          <div className="relative h-56 sm:h-64 md:h-72 lg:h-80 w-full overflow-hidden">
            <Image
              src={shop.banner_url}
              alt="Shop banner"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          </div>
        ) : (
          <div
            className="h-56 sm:h-64 md:h-72 lg:h-80 w-full overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 50%, ${adjustBrightness(gradientEnd, -15)} 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
                }}
              />
            </div>
          </div>
        )}

        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm text-[#666] hover:bg-white transition-all shadow-sm"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Shop Info Card ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white border border-[#e8e6e3] shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Logo */}
              <div
                className="w-20 h-20 md:w-24 md:h-24 overflow-hidden border-4 border-white shadow-md shrink-0 -mt-14 md:-mt-16"
                style={{ boxShadow: `0 4px 20px rgba(${accentRgb}, 0.2)` }}
              >
                {shop.logo_url ? (
                  <Image
                    src={shop.logo_url}
                    alt={shop.shop_name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    }}
                  >
                    {getInitials(shop.shop_name)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] truncate">
                    {shop.shop_name}
                  </h1>
                  {profile?.verified && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold w-fit"
                      style={{ background: badgeGradient }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {badgeLabel}
                    </span>
                  )}
                </div>

                {shop.description && (
                  <p className="text-[#666] text-sm md:text-base leading-relaxed max-w-2xl mb-4">
                    {shop.description}
                  </p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b6560]">
                  {memberSince && (
                    <span className="inline-flex items-center gap-1.5 bg-[#faf9f7] px-3 py-1.5 rounded-full">
                      <Calendar className="w-3.5 h-3.5 text-[#8a8280]" />
                      Member since {memberSince}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-[#faf9f7] px-3 py-1.5 rounded-full">
                    <Package className="w-3.5 h-3.5 text-[#8a8280]" />
                    {listings.length}{" "}
                    {listings.length === 1 ? "listing" : "listings"}
                  </span>
                  {promotedCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                      <Star className="w-3.5 h-3.5" />
                      {promotedCount} featured
                    </span>
                  )}
                </div>
              </div>

              {/* Social links + Contact */}
              <div className="flex items-center gap-2 shrink-0 md:mt-0 mt-2">
                {shop.website ? (
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#faf9f7] text-[#666] hover:text-[#8E7A6B] hover:bg-[#f0eeeb] transition-all"
                    title="Website"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                ) : (
                  <span
                    className="p-2.5 bg-[#faf9f7] text-[#8a8280] cursor-not-allowed"
                    title="Website — not set"
                  >
                    <Globe className="w-5 h-5" />
                  </span>
                )}
                {shop.facebook ? (
                  <a
                    href={shop.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#faf9f7] text-[#666] hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                ) : (
                  <span
                    className="p-2.5 bg-[#faf9f7] text-[#8a8280] cursor-not-allowed"
                    title="Facebook — not set"
                  >
                    <Facebook className="w-5 h-5" />
                  </span>
                )}
                {shop.instagram ? (
                  <a
                    href={shop.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#faf9f7] text-[#666] hover:text-pink-600 hover:bg-pink-50 transition-all"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                ) : (
                  <span
                    className="p-2.5 bg-[#faf9f7] text-[#8a8280] cursor-not-allowed"
                    title="Instagram — not set"
                  >
                    <Instagram className="w-5 h-5" />
                  </span>
                )}
                {shop.tiktok ? (
                  <a
                    href={shop.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-[#faf9f7] text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0eeeb] transition-all"
                    title="TikTok"
                  >
                    <Music className="w-5 h-5" />
                  </a>
                ) : (
                  <span
                    className="p-2.5 bg-[#faf9f7] text-[#8a8280] cursor-not-allowed"
                    title="TikTok — not set"
                  >
                    <Music className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats Bar ─────────────────────────────────────────────────── */}
          <div className="border-t border-[#e8e6e3] bg-[#faf9f7]/50">
            <div className="grid grid-cols-3 divide-x divide-[#e8e6e3]">
              <div className="text-center py-4 px-3">
                <div className="text-xl md:text-2xl font-bold text-[#1a1a1a]">
                  {listings.length}
                </div>
                <div className="text-[11px] md:text-xs text-[#6b6560] mt-0.5 font-medium">
                  Active Listings
                </div>
              </div>
              <div className="text-center py-4 px-3">
                <div className="text-xl md:text-2xl font-bold text-[#1a1a1a]">
                  {listings
                    .reduce((s, l) => s + (l.view_count ?? 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-[11px] md:text-xs text-[#6b6560] mt-0.5 font-medium">
                  Total Views
                </div>
              </div>
              <div className="text-center py-4 px-3">
                <div className="text-xl md:text-2xl font-bold text-[#1a1a1a] flex items-center justify-center gap-1">
                  <ShieldCheck
                    className="w-5 h-5"
                    style={{ color: statusColor }}
                  />
                  {statusLabel}
                </div>
                <div className="text-[11px] md:text-xs text-[#6b6560] mt-0.5 font-medium">
                  Seller Status
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Listings Section ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {listings.length > 0 ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg md:text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-[#8a8280]" />
                Shop Listings
                <span className="text-sm font-normal text-[#8a8280] ml-1">
                  ({filtered.length})
                </span>
              </h2>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8280] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-[#e8e6e3] bg-white text-sm text-[#1a1a1a] placeholder:text-[#8a8280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/20 focus-visible:border-[#8E7A6B]/30 transition-all w-48 md:w-56"
                  />
                </div>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="px-3 py-2.5 border border-[#e8e6e3] bg-white text-sm text-[#666] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/20 focus-visible:border-[#8E7A6B]/30 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  accentColor={accentColor}
                />
              ))}
            </div>

            {filtered.length === 0 && search.trim() && (
              <div className="text-center py-16 bg-white border border-[#e8e6e3] mt-4">
                <Search className="w-8 h-8 text-[#8a8280] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">
                  No results found
                </h3>
                <p className="text-[#6b6560] text-sm">
                  Try a different search term.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white border border-[#e8e6e3]">
            <div
              className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
              style={{
                background: `linear-gradient(135deg, ${gradientStart}20, ${gradientEnd}20)`,
              }}
            >
              <Store className="w-8 h-8" style={{ color: gradientStart }} />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
              No listings yet
            </h2>
            <p className="text-[#6b6560] max-w-sm mx-auto text-sm">
              This shop hasn&apos;t posted any items for sale yet. Check back
              soon for new arrivals!
            </p>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
