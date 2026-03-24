"use client";

import { Facebook, Instagram, Globe, Check, Music } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import ListingCard from "@/app/components/listing-card";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";
import type { Tables } from "@/lib/supabase/database.types";

type DealerShop = Omit<
  Tables<"dealer_shops">,
  "stripe_customer_id" | "stripe_subscription_id"
>;

type ShopProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
  is_dealer: boolean;
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

export default function ShopClient({
  shop,
  listings,
  profile,
}: ShopClientProps) {
  const accentColor = shop.accent_color || "#4f46e5";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(accentColor);
  const gradientStart = isValidHex ? accentColor : "#4f46e5";
  const gradientEnd = isValidHex
    ? adjustBrightness(accentColor, -20)
    : "#4338ca";

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "";
    return formatDate(profile.created_at);
  }, [profile?.created_at]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative h-64 md:h-80 w-full overflow-hidden"
        style={{
          backgroundImage: shop.banner_url
            ? `url(${shop.banner_url})`
            : `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {shop.banner_url && (
          <div className="absolute inset-0 bg-black/20" />
        )}

        {/* Logo circle */}
        <div className="absolute -bottom-12 left-0 right-0 flex justify-center">
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.shop_name}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold"
                style={{ backgroundColor: gradientStart }}
              >
                {getInitials(shop.shop_name)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Shop info ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
          {/* Name + badge */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">
              {shop.shop_name}
            </h1>
            {profile?.verified && (
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: gradientStart }}
              >
                <Check className="w-4 h-4" />
                Verified Dealer
              </span>
            )}
          </div>

          {/* Description */}
          {shop.description && (
            <p className="text-center text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              {shop.description}
            </p>
          )}

          {/* Info bar */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 py-6 border-t border-b border-gray-100 mb-6">
            {shop.website && (
              <a
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm md:text-base">Website</span>
              </a>
            )}

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {shop.facebook && (
                <a
                  href={shop.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  title="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {shop.instagram && (
                <a
                  href={shop.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all"
                  title="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {shop.tiktok && (
                <a
                  href={shop.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-all"
                  title="TikTok"
                >
                  <Music className="w-5 h-5" />
                </a>
              )}
            </div>

            {memberSince && (
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500">Member since</p>
                <p className="font-semibold text-gray-900">{memberSince}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center">
            <div className="text-center px-6 py-4">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {listings.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {listings.length === 1 ? "Listing" : "Listings"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Listings grid ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {listings.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              All Listings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No listings yet
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              This dealer hasn&apos;t posted any items for sale yet. Check back
              soon!
            </p>
          </div>
        )}
      </div>

      <div className="h-12" />
    </div>
  );
}
