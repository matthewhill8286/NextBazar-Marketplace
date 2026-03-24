"use client";

import { Check, MapPin } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import ListingCard from "@/app/components/listing-card";
import type { ListingCardRow } from "@/lib/supabase/supabase.types";

type Props = {
  shop: {
    shop_name: string;
    description: string | null;
    banner_url: string | null;
    accent_color: string | null;
  };
  listings: ListingCardRow[];
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
    is_dealer: boolean;
    created_at: string;
  } | null;
};

function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default function ShopHome({ shop, listings, profile }: Props) {
  const accent = shop.accent_color || "#4f46e5";
  const accentDark = adjustBrightness(accent, -20);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "";
    return new Date(profile.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  }, [profile?.created_at]);

  return (
    <div>
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div
        className="relative h-48 md:h-64 w-full"
        style={{
          backgroundImage: shop.banner_url
            ? `url(${shop.banner_url})`
            : `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {shop.banner_url && (
          <div className="absolute inset-0 bg-black/20" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg mb-2">
              {shop.shop_name}
            </h1>
            {shop.description && (
              <p className="text-white/80 text-lg md:text-xl max-w-xl mx-auto drop-shadow">
                {shop.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Info bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
          {profile?.verified && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white font-semibold text-xs"
              style={{ backgroundColor: accent }}
            >
              <Check className="w-3.5 h-3.5" />
              Verified Dealer
            </span>
          )}
          <span className="text-gray-600">
            <strong className="text-gray-900">{listings.length}</strong>{" "}
            {listings.length === 1 ? "listing" : "listings"}
          </span>
          {memberSince && (
            <span className="text-gray-500">
              Member since {memberSince}
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            Cyprus
          </span>
        </div>
      </div>

      {/* ── Listings grid ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Coming soon
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              This shop is setting up. Check back soon for listings!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
