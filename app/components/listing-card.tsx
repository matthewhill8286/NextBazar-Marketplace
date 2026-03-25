"use client";

import { Check, Clock, Eye, GitCompareArrows, MapPin, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCompare } from "@/lib/compare-context";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { CONDITION_KEYS, unwrap } from "@/lib/format-helpers";
import CategoryIcon, { getCategoryConfig } from "./category-icon";
import FavoriteButton from "./favorite-button";
import {FALLBACK_LISTING_IMAGE} from "@/lib/constants";

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
    profiles?: { is_dealer?: boolean } | null;
  };
  userId?: string | null;
  isSaved?: boolean;
  onUnsave?: () => void;
};

export default function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations("listing");
  const { add, remove, isCompared, isFull } = useCompare();

  const cat = unwrap(listing.categories) || unwrap(listing.category);
  const loc = unwrap(listing.locations) || unwrap(listing.location);
  const isSold = listing.status === "sold";
  const compared = isCompared(listing.id);

  const imageSrc = listing.primary_image_url || FALLBACK_LISTING_IMAGE;

  function formatPrice(price: number | null, currency: string): string {
    if (price === null) return t("contact");
    const sym = currency === "EUR" ? "€" : currency;
    return `${sym}${price.toLocaleString()}`;
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t("timeMinutes", { n: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("timeHours", { n: hrs });
    const days = Math.floor(hrs / 24);
    return t("timeDays", { n: days });
  }

  function formatCondition(condition: string): string {
    const key = CONDITION_KEYS[condition];
    return key ? t(key) : condition.replace(/_/g, " ");
  }

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-gray-200/80 hover:border-gray-200 hover:-translate-y-1 block"
    >
      {/* Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={listing.title}
          fill
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isSold ? "opacity-60" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Bottom gradient for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Category icon */}
        {cat?.slug && (
          <span
            className={`absolute top-2.5 right-2.5 ${getCategoryConfig(cat.slug).bg} w-7 h-7 flex items-center justify-center rounded-full shadow-sm z-10`}
          >
            <CategoryIcon slug={cat.slug} size={14} />
          </span>
        )}

        {/* Status badges */}
        {listing.is_promoted && (
          <span className="absolute top-2.5 left-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
            ✦ {t("featured")}
          </span>
        )}
        {listing.is_urgent && !listing.is_promoted && (
          <span className="absolute top-2.5 left-2.5 bg-linear-to-r from-red-500 to-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md z-10">
            ⚡ {t("urgent")}
          </span>
        )}

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="bg-white text-gray-900 text-sm font-bold px-5 py-1.5 rounded-full shadow-lg tracking-widest uppercase">
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
            className={`absolute bottom-2 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-colors ${
              compared
                ? "bg-indigo-600 text-white"
                : isFull
                  ? "bg-white/80 text-gray-300 cursor-not-allowed"
                  : "bg-white/80 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            {compared ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <GitCompareArrows className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* View count on gradient */}
        <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-white/90 text-xs font-medium">
          <Eye className="w-3 h-3" />
          {(listing.view_count || 0).toLocaleString()}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors duration-150">
          {listing.title}
        </h3>

        {FEATURE_FLAGS.DEALERS && listing.profiles?.is_dealer && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full mb-1">
            <Store className="w-2.5 h-2.5" /> Pro Seller
          </span>
        )}

        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{loc?.name || "Cyprus"}</span>
          {listing.condition && (
            <>
              <span className="text-gray-200">·</span>
              <span className="shrink-0">
                {formatCondition(listing.condition)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`font-extrabold ${listing.price === null ? "text-gray-500 text-sm" : "text-gray-900 text-lg"}`}
          >
            {formatPrice(listing.price, listing.currency)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="w-3 h-3" />
            {timeAgo(listing.created_at)}
          </span>
        </div>
      </div>

      {/* Amber accent stripe for featured listings */}
      {listing.is_promoted && (
        <div className="absolute left-0 bottom-0 right-0 h-0.5 bg-linear-to-r from-amber-400 via-orange-400 to-amber-400" />
      )}
    </Link>
  );
}
