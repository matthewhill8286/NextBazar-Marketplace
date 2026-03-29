import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calendar,
  Car,
  ChevronRight,
  Clock,
  Eye,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Palette,
  Shield,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import ListingCard from "@/app/components/listing-card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { CONDITION_LABELS } from "@/lib/format-helpers";
import type {
  ListingCardRow,
  ListingDetailRow,
} from "@/lib/supabase/supabase.types";
import ImageGallery from "./image-gallery";
import { FavoriteAction, ReportAction, ShareAction } from "./listing-actions";
import ListingInteractions from "./listing-interactions";
import OwnerInsights from "./owner-insights";
import PriceHistory from "./price-history";
import { LeaveReviewPrompt, SellerReviews } from "./seller-reviews";

// ─── Helpers (server-safe, no hooks) ──────────────────────────────────────────

function formatPrice(
  p: number | null,
  currency: string,
  contactLabel: string,
): string {
  if (p === null) return contactLabel;
  const sym = currency === "EUR" ? "\u20AC" : currency;
  return `${sym}${p.toLocaleString()}`;
}

function timeAgo(
  dateStr: string,
  locale: string,
  labels: { m: string; h: string; d: string },
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return labels.m.replace("{n}", String(mins));
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return labels.h.replace("{n}", String(hrs));
  const days = Math.floor(hrs / 24);
  if (days < 30) return labels.d.replace("{n}", String(days));
  const dateLocale = locale === "el" ? "el-GR" : "en-GB";
  return new Date(dateStr).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(dateStr: string, locale: string): string {
  const dateLocale = locale === "el" ? "el-GR" : "en-GB";
  return new Date(dateStr).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  listing: ListingDetailRow;
  related: ListingCardRow[];
  accentColor: string | null;
  shopSlug: string | null;
};

// ─── Server Component ─────────────────────────────────────────────────────────

export default async function ListingDetailServer({
  listing,
  related,
  accentColor,
  shopSlug,
}: Props) {
  const [t, tCommon, locale] = await Promise.all([
    getTranslations("listing"),
    getTranslations("common"),
    getLocale(),
  ]);

  const profile = listing.profiles;
  const sellerRating = profile?.rating || 0;
  const sellerReviews = profile?.total_reviews || 0;
  const sellerYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : 2024;

  const galleryImages =
    listing.listing_images && listing.listing_images.length > 0
      ? [...listing.listing_images].sort(
          (a: any, b: any) => a.sort_order - b.sort_order,
        )
      : listing.primary_image_url
        ? [{ url: listing.primary_image_url, sort_order: 0 }]
        : [];

  const conditionLabel = (c: string | null): string => {
    if (!c) return "\u2014";
    return (
      CONDITION_LABELS[c] ||
      c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
    );
  };

  const timeLabels = {
    m: t("timeMinutes", { n: "{n}" }),
    h: t("timeHours", { n: "{n}" }),
    d: t("timeDays", { n: "{n}" }),
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center gap-1.5 text-sm text-[#999] overflow-x-auto hide-scrollbar">
          <Link
            href="/"
            className="hover:text-[#1a1a1a] flex items-center gap-1 shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("home")}
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0 text-[#ddd]" />
          <Link
            href={`/search?category=${listing.categories?.slug || ""}`}
            className="hover:text-[#1a1a1a] shrink-0 transition-colors"
          >
            {listing.categories?.name || "Listing"}
          </Link>
          {listing.subcategories && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0 text-[#ddd]" />
              <Link
                href={`/search?category=${listing.categories?.slug || ""}&subcategory=${listing.subcategories.slug}`}
                className="hover:text-[#1a1a1a] shrink-0 transition-colors"
              >
                {listing.subcategories.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 shrink-0 text-[#ddd]" />
          <span className="text-[#1a1a1a] font-medium truncate">
            {listing.title}
          </span>
        </nav>
      </div>

      {/* Gallery — client component, renders immediately with server data */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <ImageGallery
          images={galleryImages}
          title={listing.title}
          videoUrl={listing.video_url}
          listingStatus={listing.status}
          offerStatus={null}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div
              className={`bg-white border overflow-hidden ${listing.status === "sold" ? "border-[#ccc]" : "border-[#e8e6e3]"}`}
            >
              {/* Sold banner */}
              {listing.status === "sold" && (
                <div className="flex items-center justify-center gap-3 bg-[#8E7A6B] text-white py-3 px-6">
                  <span className="text-xs font-medium uppercase tracking-widest opacity-60">
                    ---
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em]">
                    {t("sold")}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-widest opacity-60">
                    ---
                  </span>
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {listing.is_promoted && (
                    <span className="bg-[#8E7A6B] text-white text-[9px] font-medium px-3 py-1 uppercase tracking-[0.2em]">
                      {t("featured")}
                    </span>
                  )}
                  {listing.is_urgent && (
                    <span className="bg-red-700 text-white text-[9px] font-medium px-3 py-1 uppercase tracking-[0.2em]">
                      {t("urgent")}
                    </span>
                  )}
                  <span
                    className={`${getCategoryConfig(listing.categories?.slug).bg} text-xs font-medium px-2.5 py-1 flex items-center gap-1.5`}
                  >
                    <CategoryIcon slug={listing.categories?.slug} size={12} />
                    <span
                      className={
                        getCategoryConfig(listing.categories?.slug).color
                      }
                    >
                      {listing.categories?.name}
                    </span>
                  </span>
                  {listing.condition && (
                    <span className="bg-[#f0eeeb] text-[#666] text-xs font-medium px-2.5 py-1">
                      {conditionLabel(listing.condition)}
                    </span>
                  )}
                  {listing.price_type === "negotiable" && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1">
                      {tCommon("negotiable")}
                    </span>
                  )}
                  {listing.price_type === "free" && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1">
                      {tCommon("free")}
                    </span>
                  )}
                </div>

                <h1
                  className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-3 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {listing.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#999] mb-5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#bbb]" />
                    {listing.locations?.name || "Cyprus"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#bbb]" />
                    {timeAgo(listing.created_at, locale, timeLabels)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#bbb]" />
                    {t("views", {
                      count: (listing.view_count || 0).toLocaleString(),
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#bbb]" />
                    {t("savedCount", {
                      count: (listing.favorite_count || 0).toLocaleString(),
                    })}
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-1">
                  <span
                    className="text-3xl md:text-4xl font-light text-[#1a1a1a]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {formatPrice(
                      listing.price,
                      listing.currency,
                      t("contactForPrice"),
                    )}
                  </span>
                  {listing.price_type === "negotiable" && (
                    <span className="text-sm text-emerald-600 font-medium pb-1">
                      {t("priceNegotiable")}
                    </span>
                  )}
                </div>

                {/* Owner-only market value is rendered inside ListingInteractions */}

                <div className="flex items-center gap-2 pt-2">
                  <FavoriteAction listingId={listing.id} />
                  <ShareAction title={listing.title} slug={listing.slug} />
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="bg-white p-6 border border-[#e8e6e3]">
              <h2
                className="text-lg font-light text-[#1a1a1a] mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("details")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-[#faf9f7] p-3.5">
                  <div className="p-2 bg-white shadow-sm">
                    <Tag className="w-4 h-4 text-[#999]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#999] font-medium uppercase tracking-[0.15em]">
                      {t("category")}
                    </div>
                    <div className="text-sm font-medium text-[#1a1a1a]">
                      {listing.categories?.name || "\u2014"}
                    </div>
                  </div>
                </div>
                {listing.condition && (
                  <div className="flex items-center gap-3 bg-[#faf9f7] p-3.5">
                    <div className="p-2 bg-white shadow-sm">
                      <Box className="w-4 h-4 text-[#999]" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#999] font-medium uppercase tracking-[0.15em]">
                        {t("condition")}
                      </div>
                      <div className="text-sm font-medium text-[#1a1a1a]">
                        {conditionLabel(listing.condition)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-[#faf9f7] p-3.5">
                  <div className="p-2 bg-white shadow-sm">
                    <MapPin className="w-4 h-4 text-[#999]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#999] font-medium uppercase tracking-[0.15em]">
                      {t("location")}
                    </div>
                    <div className="text-sm font-medium text-[#1a1a1a]">
                      {listing.locations?.name || "Cyprus"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#faf9f7] p-3.5">
                  <div className="p-2 bg-white shadow-sm">
                    <Calendar className="w-4 h-4 text-[#999]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#999] font-medium uppercase tracking-[0.15em]">
                      {t("posted")}
                    </div>
                    <div className="text-sm font-medium text-[#1a1a1a]">
                      {formatDate(listing.created_at, locale)}
                    </div>
                  </div>
                </div>
                {/* Owner quality score rendered client-side in ListingInteractions */}
              </div>
            </div>

            {/* Vehicle Attributes */}
            {listing.categories?.slug === "vehicles" &&
              listing.attributes &&
              typeof listing.attributes === "object" &&
              !Array.isArray(listing.attributes) &&
              (() => {
                const rawAttrs = listing.attributes as Record<string, unknown>;
                const attrs: Record<string, string> = {};
                for (const [k, v] of Object.entries(rawAttrs)) {
                  if (v != null && v !== "") attrs[k] = String(v);
                }
                const fields: {
                  key: string;
                  label: string;
                  icon: typeof Car;
                  format?: (v: string) => string;
                }[] = [
                  { key: "make", label: "Make", icon: Car },
                  { key: "model", label: "Model", icon: Car },
                  { key: "year", label: "Year", icon: Calendar },
                  {
                    key: "mileage",
                    label: "Mileage",
                    icon: Gauge,
                    format: (v) => `${Number(v).toLocaleString()} km`,
                  },
                  {
                    key: "fuel_type",
                    label: "Fuel",
                    icon: Fuel,
                    format: (v) => v.charAt(0).toUpperCase() + v.slice(1),
                  },
                  {
                    key: "transmission",
                    label: "Transmission",
                    icon: Tag,
                    format: (v) => v.charAt(0).toUpperCase() + v.slice(1),
                  },
                  { key: "color", label: "Color", icon: Palette },
                  {
                    key: "body_type",
                    label: "Body Type",
                    icon: Car,
                    format: (v) => v.charAt(0).toUpperCase() + v.slice(1),
                  },
                  {
                    key: "engine_size",
                    label: "Engine",
                    icon: Gauge,
                    format: (v) =>
                      String(v).endsWith("L") ? String(v) : `${v}L`,
                  },
                  { key: "doors", label: "Doors", icon: Car },
                  {
                    key: "drive_type",
                    label: "Drive",
                    icon: Car,
                    format: (v) => v.toUpperCase(),
                  },
                  { key: "owners", label: "Owners", icon: Shield },
                  {
                    key: "service_history",
                    label: "Service History",
                    icon: Shield,
                    format: (v) => v.charAt(0).toUpperCase() + v.slice(1),
                  },
                ];
                const visible = fields.filter((f) => attrs[f.key]?.trim());
                if (visible.length === 0) return null;
                return (
                  <div className="bg-white p-6 border border-[#e8e6e3]">
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="w-5 h-5 text-[#999]" />
                      <h2
                        className="text-lg font-light text-[#1a1a1a]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        Vehicle Specifications
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {visible.map((field) => {
                        const Icon = field.icon;
                        const raw = attrs[field.key];
                        const display = field.format ? field.format(raw) : raw;
                        return (
                          <div
                            key={field.key}
                            className="flex items-center gap-3 bg-[#faf9f7] p-3.5"
                          >
                            <div className="p-2 bg-white shadow-sm">
                              <Icon className="w-4 h-4 text-[#999]" />
                            </div>
                            <div>
                              <div className="text-[10px] text-[#999] font-medium uppercase tracking-[0.15em]">
                                {field.label}
                              </div>
                              <div className="text-sm font-medium text-[#1a1a1a]">
                                {display}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            {/* Description */}
            {listing.description && (
              <div className="bg-white p-6 border border-[#e8e6e3]">
                <h2
                  className="text-lg font-light text-[#1a1a1a] mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t("description")}
                </h2>
                <div className="text-[#666] leading-relaxed whitespace-pre-wrap text-[15px]">
                  {listing.description}
                </div>
              </div>
            )}

            {/* Owner-only: AI Insights, market value, quality score */}
            <OwnerInsights
              listingId={listing.id}
              listingUserId={listing.user_id}
              price={listing.price}
              currency={listing.currency || "EUR"}
              descriptionLength={listing.description?.length ?? 0}
              galleryImageCount={galleryImages.length}
            />

            {/* Price History */}
            <PriceHistory
              listingId={listing.id}
              currentPrice={listing.price}
              currency={listing.currency || "EUR"}
            />

            <div className="flex justify-end">
              <ReportAction listingId={listing.id} />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Seller card */}
            <div className="bg-white p-6 border border-[#e8e6e3] sticky top-20">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 bg-[#2C2826] flex items-center justify-center text-white font-medium text-xl shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.display_name || "Seller"}
                      loading="eager"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (profile?.display_name || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={
                        shopSlug
                          ? `/shop/${shopSlug}`
                          : `/profile/${listing.user_id}`
                      }
                      className="font-medium text-[#1a1a1a] truncate transition-colors hover:text-[#666]"
                      style={
                        accentColor
                          ? {
                              ["--seller-accent" as string]: accentColor,
                            }
                          : undefined
                      }
                    >
                      {profile?.display_name || "Seller"}
                    </Link>
                    {profile?.verified && (
                      <Shield
                        className="w-4 h-4 shrink-0"
                        style={
                          accentColor
                            ? { color: accentColor }
                            : { color: "#1a1a1a" }
                        }
                      />
                    )}
                    {FEATURE_FLAGS.DEALERS && profile?.is_pro_seller && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 shrink-0 tracking-[0.15em] uppercase bg-red-50 text-red-600 border border-red-100">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5"
                        fill={
                          i <= Math.round(sellerRating) ? "#f59e0b" : "none"
                        }
                        stroke="#f59e0b"
                      />
                    ))}
                    <span className="text-xs text-[#999] ml-1">
                      {sellerRating} ({sellerReviews})
                    </span>
                  </div>
                  <p className="text-[11px] text-[#bbb] mt-0.5">
                    {t("memberSince")} {sellerYear}
                  </p>
                </div>
              </div>

              {/* ContactButtons + Offer section + realtime + view tracking */}
              <ListingInteractions
                listing={listing}
                accentColor={accentColor}
                shopSlug={shopSlug}
              />

              <div className="mt-4 pt-4 border-t border-[#e8e6e3] text-center">
                <Link
                  href={
                    shopSlug
                      ? `/shop/${shopSlug}`
                      : `/profile/${listing.user_id}`
                  }
                  className="text-sm font-medium hover:underline text-[#1a1a1a]"
                  style={accentColor ? { color: accentColor } : undefined}
                >
                  {shopSlug ? t("visitShop") : t("viewSellerProfile")}
                </Link>
              </div>
            </div>

            {/* Safety tips */}
            <div className="bg-[#faf9f7] p-5 border border-[#e8e6e3]">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#999]" />
                <p className="text-sm text-[#1a1a1a] font-medium">
                  {t("safetyTips")}
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#999] leading-relaxed">
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#ddd]">&ndash;</span>
                  {t("safetyTip1")}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#ddd]">&ndash;</span>
                  {t("safetyTip2")}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#ddd]">&ndash;</span>
                  {t("safetyTip3")}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#ddd]">&ndash;</span>
                  {t("safetyTip4")}
                </li>
              </ul>
            </div>

            {/* Leave a review — shown only when listing is sold */}
            {listing.status === "sold" && profile?.id && (
              <LeaveReviewPrompt
                listingId={listing.id}
                sellerId={profile.id}
                sellerName={profile.display_name || "the seller"}
              />
            )}

            {/* Seller reviews */}
            {profile?.id && (
              <SellerReviews
                sellerId={profile.id}
                avgRating={sellerRating}
                totalReviews={sellerReviews}
              />
            )}
          </div>
        </div>

        {/* Related Listings */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#999] mb-4">
                  More to explore
                </p>
                <h2
                  className="text-3xl font-light text-[#1a1a1a]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t("similarListings")}
                </h2>
              </div>
              <Link
                href={`/search?category=${listing.categories?.slug || ""}`}
                className="group hidden md:inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase text-[#999] hover:text-[#1a1a1a] transition-colors"
              >
                {t("viewMore")}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
