"use client";

import {
  Check,
  Clock,
  Eye,
  GitCompareArrows,
  MapPin,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";
import { useCompare } from "@/lib/compare-context";
import { FALLBACK_LISTING_IMAGE } from "@/lib/constants";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { CONDITION_KEYS, unwrap } from "@/lib/format-helpers";
import CategoryIcon, { getCategoryConfig } from "./category-icon";
import FavoriteButton from "./favorite-button";

export type CatLike = { name: string; slug?: string; icon?: string | null };
export type LocLike = { name: string; slug?: string };

type ListingCardProps = {
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number | null;
    currency: string;
    primary_image_url: string | null;
    is_promoted: boolean;
    is_urgent: boolean;
    condition: string | null;
    view_count: number;
    created_at: string;
    status?: string | null;
    category?: CatLike | null;
    categories?: CatLike | null;
    location?: LocLike | null;
    locations?: LocLike | null;
    profiles?: { is_pro_seller?: boolean } | null;
  };
  accentColor?: string;
  userId?: string | null;
  isSaved?: boolean;
  onUnsave?: () => void;
};

function ListingCard({ listing, accentColor }: ListingCardProps) {
  const t = useTranslations("listing");
  const { add, remove, isCompared, isFull } = useCompare();

  const cat = unwrap(listing.categories) || unwrap(listing.category);
  const loc = unwrap(listing.locations) || unwrap(listing.location);
  const isSold = listing.status === "sold";
  const compared = isCompared(listing.id);

  const imageSrc = listing.primary_image_url || FALLBACK_LISTING_IMAGE;

  function formatPrice(price: number | null, currency: string): string {
    if (price === null) return t("contact");
    const sym = currency === "EUR" ? "\u20AC" : currency;
    return `${sym}${price.toLocaleString()}`;
  }

  const [timeAgoLabel, setTimeAgoLabel] = useState("");

  useEffect(() => {
    function computeTimeAgo(dateStr: string): string {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return t("timeMinutes", { n: mins });
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return t("timeHours", { n: hrs });
      const days = Math.floor(hrs / 24);
      return t("timeDays", { n: days });
    }
    setTimeAgoLabel(computeTimeAgo(listing.created_at));
  }, [listing.created_at, t]);

  function formatCondition(condition: string): string {
    const key = CONDITION_KEYS[condition];
    return key ? t(key) : condition.replace(/_/g, " ");
  }

  const cardStyle = accentColor
    ? ({ "--card-accent": accentColor } as React.CSSProperties)
    : undefined;

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group relative bg-white border border-[#e8e6e3] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/8 hover:-translate-y-1 block"
      style={cardStyle}
    >
      {/* Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-[#f0eeeb]">
        <Image
          src={imageSrc}
          alt={listing.title}
          fill
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isSold ? "opacity-40 grayscale" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Category badge */}
        {cat?.slug && (
          <span
            className={`absolute top-3 right-3 ${getCategoryConfig(cat.slug).bg} w-8 h-8 flex items-center justify-center shadow-sm z-10 backdrop-blur-sm`}
          >
            <CategoryIcon slug={cat.slug} size={15} />
          </span>
        )}

        {/* Status badges */}
        {listing.is_promoted && (
          <span className="absolute top-3 left-3 bg-[#2C2826] text-white text-[9px] font-medium px-3 py-1.5 z-10 tracking-[0.2em] uppercase">
            {t("featured")}
          </span>
        )}
        {listing.is_urgent && !listing.is_promoted && (
          <span className="absolute top-3 left-3 bg-red-700 text-white text-[9px] font-medium px-3 py-1.5 z-10 tracking-[0.2em] uppercase">
            {t("urgent")}
          </span>
        )}

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/30 backdrop-blur-[3px]">
            <span className="bg-[#2C2826] text-white text-[10px] font-medium px-6 py-2.5 tracking-[0.3em] uppercase">
              {t("sold")}
            </span>
          </div>
        )}

        <FavoriteButton listingId={listing.id} />

        {/* Compare toggle */}
        {!isSold && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              compared
                ? remove(listing.id)
                : add({
                    id: listing.id,
                    slug: listing.slug,
                    title: listing.title,
                    price: listing.price,
                    currency: listing.currency,
                    primary_image_url: listing.primary_image_url,
                    condition: listing.condition,
                    category: cat,
                    location: loc,
                  });
            }}
            disabled={!compared && isFull}
            title={
              compared
                ? "Remove from comparison"
                : isFull
                  ? "Remove a listing to add this one"
                  : "Add to comparison"
            }
            className={`absolute bottom-3 right-3 z-10 w-7 h-7 flex items-center justify-center shadow-sm transition-colors ${
              compared
                ? "bg-[#2C2826] text-white"
                : isFull
                  ? "bg-white/70 text-[#ccc] cursor-not-allowed"
                  : "bg-white/70 text-[#666] hover:bg-white hover:text-[#1a1a1a]"
            }`}
          >
            {compared ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <GitCompareArrows className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* View count */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/80 text-[10px] font-medium drop-shadow-sm tracking-wider">
          <Eye className="w-3 h-3" />
          {(listing.view_count || 0).toLocaleString()}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3
          className={`font-medium text-[#1a1a1a] text-sm leading-snug line-clamp-2 mb-2 transition-colors duration-300 ${
            accentColor
              ? "group-hover:[color:var(--card-accent)]"
              : "group-hover:text-[#666]"
          }`}
        >
          {listing.title}
        </h3>

        {FEATURE_FLAGS.DEALERS && listing.profiles?.is_pro_seller && (
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 tracking-wider uppercase mb-1.5 ${
              accentColor ? "" : "bg-[#f0eeeb] text-[#666]"
            }`}
            style={
              accentColor
                ? { backgroundColor: `${accentColor}14`, color: accentColor }
                : undefined
            }
          >
            <Store className="w-2.5 h-2.5" /> Pro Seller
          </span>
        )}

        <div className="flex items-center gap-1.5 text-[#999] text-[11px] mb-3 tracking-wide">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{loc?.name || "Cyprus"}</span>
          {listing.condition && (
            <>
              <span className="text-[#ddd]">&middot;</span>
              <span className="shrink-0">
                {formatCondition(listing.condition)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`font-semibold ${listing.price === null ? "text-[#999] text-sm" : "text-[#1a1a1a] text-lg tracking-tight"}`}
            style={
              listing.price !== null
                ? { fontFamily: "'Playfair Display', serif" }
                : undefined
            }
          >
            {formatPrice(listing.price, listing.currency)}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#bbb] tracking-wider">
            <Clock className="w-3 h-3" />
            {timeAgoLabel}
          </span>
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Link>
  );
}

export default memo(ListingCard);
