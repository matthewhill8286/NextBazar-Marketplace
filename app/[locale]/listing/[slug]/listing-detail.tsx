"use client";

import {
  ArrowLeft,
  Box,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  MapPin,
  Shield,
  Star,
  Activity,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import ListingCard from "@/app/components/listing-card";
import { createClient } from "@/lib/supabase/client";
import AiInsights, { type InsightsPriceSummaryAction } from "./ai-insights";
import ImageGallery from "./image-gallery";
import {
  ContactButtons,
  FavoriteAction,
  ReportAction,
  ShareAction,
} from "./listing-actions";
import { LeaveReviewPrompt, SellerReviews } from "./seller-reviews";
import MakeOfferModal from "@/app/components/make-offer-modal";
import PriceHistory from "./price-history";
import CategoryIcon, { getCategoryConfig } from "@/app/components/category-icon";

const LISTING_SELECT = `
  *,
  categories(name, slug, icon),
  subcategories(name, slug),
  locations(name, slug),
  profiles!listings_user_id_fkey(id, display_name, avatar_url, verified, rating, total_reviews, is_dealer, created_at, whatsapp_number, telegram_username),
  listing_images(id, url, thumbnail_url, sort_order)
`;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  );
}

function ListingDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back button */}
      <Bone className="h-5 w-20 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Image gallery */}
          <Bone className="w-full aspect-[4/3] rounded-2xl" />

          {/* Thumbnail strip */}
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Bone key={i} className="w-16 h-16 rounded-xl shrink-0" />
            ))}
          </div>

          {/* Title card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            {/* Badge row */}
            <div className="flex gap-2">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            {/* Title */}
            <Bone className="h-8 w-3/4" />
            {/* Price */}
            <Bone className="h-10 w-1/3" />
            {/* Meta row */}
            <div className="flex gap-4 pt-1">
              <Bone className="h-4 w-24" />
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-16" />
            </div>
          </div>

          {/* Details grid */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <Bone className="h-5 w-24 mb-1" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 flex gap-3 items-center">
                  <Bone className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Bone className="h-3 w-16" />
                    <Bone className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2.5">
            <Bone className="h-5 w-28 mb-1" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-5/6" />
            <Bone className="h-4 w-4/6" />
          </div>
        </div>

        {/* ── Right column (sidebar) ── */}
        <div className="space-y-4">

          {/* Price / CTA card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <Bone className="h-9 w-1/2" />
            <Bone className="h-12 w-full rounded-xl" />
            <Bone className="h-12 w-full rounded-xl" />
            <div className="flex gap-3 pt-1">
              <Bone className="h-10 flex-1 rounded-xl" />
              <Bone className="h-10 flex-1 rounded-xl" />
            </div>
          </div>

          {/* Seller card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <Bone className="h-5 w-16 mb-1" />
            <div className="flex items-center gap-3">
              <Bone className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Bone className="h-5 w-32" />
                <Bone className="h-3.5 w-24" />
              </div>
            </div>
            <Bone className="h-px w-full bg-gray-100 rounded-full" />
            <div className="space-y-2">
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-3/4" />
            </div>
            <Bone className="h-10 w-full rounded-xl" />
          </div>

          {/* Safety tips card */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-3">
            <Bone className="h-5 w-28 bg-amber-200" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Bone className="w-3 h-3 rounded-full bg-amber-200 shrink-0" />
                <Bone className={`h-3.5 bg-amber-200 ${i % 2 === 0 ? "w-full" : "w-4/5"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const conditionKeys: Record<string, string> = {
  new: "condition_new",
  like_new: "condition_like_new",
  good: "condition_good",
  fair: "condition_fair",
  for_parts: "condition_for_parts",
};

export default function ListingDetail({ slug }: { slug: string }) {
  const t = useTranslations("listing");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aiPrice, setAiPrice] = useState<InsightsPriceSummaryAction | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [existingOffer, setExistingOffer] = useState<{ status: string } | null>(null);
  const [offerCount, setOfferCount] = useState(0);

  const dateLocale = locale === "el" ? "el-GR" : "en-GB";

  function formatPrice(p: number | null, currency: string): string {
    if (p === null) return t("contactForPrice");
    const sym = currency === "EUR" ? "€" : currency;
    return `${sym}${p.toLocaleString()}`;
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t("timeMinutes", { n: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("timeHours", { n: hrs });
    const days = Math.floor(hrs / 24);
    if (days < 30) return t("timeDays", { n: days });
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function conditionLabel(c: string | null): string {
    if (!c) return "—";
    const key = conditionKeys[c];
    return key ? t(key) : c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  useEffect(() => {
    async function load() {
      // Fetch current user in parallel with listing
      const [{ data: { user } }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("listings").select(LISTING_SELECT).eq("slug", slug).single(),
      ]);

      setCurrentUserId(user?.id ?? null);

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setListing(data);

      // Check buyer's offer history on this listing
      if (user && user.id !== data.user_id) {
        supabase
          .from("offers")
          .select("status")
          .eq("listing_id", data.id)
          .eq("buyer_id", user.id)
          .then(({ data: allOffers }) => {
            if (!allOffers) return;
            setOfferCount(allOffers.length);
            const active = allOffers.find((o) => o.status === "pending" || o.status === "countered");
            if (active) setExistingOffer(active);
          });
      }

      // Increment view count on the listing row
      supabase
        .from("listings")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id)
        .then();

      // Record daily analytics (non-owner only)
      const viewerId = user?.id ?? null;
      if (!viewerId || viewerId !== data.user_id) {
        fetch("/api/analytics/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: data.id }),
        }).catch(() => {});
      }

      // Fetch related
      const { data: rel } = await supabase
        .from("listings")
        .select(`*, categories(name, slug, icon), locations(name, slug)`)
        .eq("status", "active")
        .eq("category_id", data.category_id)
        .neq("id", data.id)
        .order("created_at", { ascending: false })
        .limit(4);

      setRelated(rel || []);
      setLoading(false);
    }
    load();
  }, [slug, supabase.from]);

  if (loading) {
    return <ListingDetailSkeleton />;
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("notFound")}
        </h1>
        <p className="text-gray-500 mb-6">
          {t("notFoundDesc")}
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          {t("browseListings")}
        </Link>
      </div>
    );
  }

  const profile = listing.profiles;
  const sellerRating = profile?.rating || 0;
  const sellerReviews = profile?.total_reviews || 0;
  const sellerYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : 2024;

  const isOwner = !!currentUserId && currentUserId === listing.user_id;

  const price = listing.price;
  // AI-computed market range (falls back to ±15% until insights load)
  const priceEstLow = aiPrice && !aiPrice.loading && aiPrice.price_low
    ? aiPrice.price_low
    : price ? Math.round(price * 0.85) : 0;
  const priceEstHigh = aiPrice && !aiPrice.loading && aiPrice.price_high
    ? aiPrice.price_high
    : price ? Math.round(price * 1.15) : 0;
  const aiMarketLoading = !aiPrice || aiPrice.loading;

  const galleryImages =
    listing.listing_images && listing.listing_images.length > 0
      ? [...listing.listing_images].sort(
          (a: any, b: any) => a.sort_order - b.sort_order,
        )
      : listing.primary_image_url
        ? [{ url: listing.primary_image_url, sort_order: 0 }]
        : [];

  const qualityScore = Math.min(
    100,
    40 +
      galleryImages.length * 10 +
      (listing.description?.length > 100 ? 20 : 0),
  );

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 overflow-x-auto hide-scrollbar">
          <Link
            href="/"
            className="hover:text-gray-700 flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon("home")}
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0 text-gray-300" />
          <Link
            href={`/search?category=${listing.categories?.slug || ""}`}
            className="hover:text-gray-700 shrink-0"
          >
            {listing.categories?.name || "Listing"}
          </Link>
          {listing.subcategories && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0 text-gray-300" />
              <Link
                href={`/search?category=${listing.categories?.slug || ""}&subcategory=${listing.subcategories.slug}`}
                className="hover:text-gray-700 shrink-0"
              >
                {listing.subcategories.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 shrink-0 text-gray-300" />
          <span className="text-gray-900 font-medium truncate">
            {listing.title}
          </span>
        </nav>
      </div>

      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <ImageGallery images={galleryImages} title={listing.title} videoUrl={listing.video_url} />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {listing.status === "sold" && (
                  <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                    {t("sold")}
                  </span>
                )}
                {listing.is_promoted && (
                  <span className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {t("featured")}
                  </span>
                )}
                {listing.is_urgent && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {t("urgent")}
                  </span>
                )}
                <span className={`${getCategoryConfig(listing.categories?.slug).bg} text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5`}>
                  <CategoryIcon slug={listing.categories?.slug} size={12} />
                  <span className={getCategoryConfig(listing.categories?.slug).color}>{listing.categories?.name}</span>
                </span>
                {listing.condition && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {conditionLabel(listing.condition)}
                  </span>
                )}
                {listing.price_type === "negotiable" && (
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {tCommon("negotiable")}
                  </span>
                )}
                {listing.price_type === "free" && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {tCommon("free")}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {listing.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 mb-5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {listing.locations?.name || "Cyprus"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {timeAgo(listing.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-gray-400" />
                  {t("views", { count: (listing.view_count || 0).toLocaleString() })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-gray-400" />
                  {t("savedCount", { count: (listing.favorite_count || 0).toLocaleString() })}
                </span>
              </div>

              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {formatPrice(listing.price, listing.currency)}
                </span>
                {listing.price_type === "negotiable" && (
                  <span className="text-sm text-green-600 font-medium pb-1">
                    {t("priceNegotiable")}
                  </span>
                )}
              </div>

              {price && isOwner && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-500" />
                    {t("marketValue")}
                  </span>
                  {aiMarketLoading ? (
                    <span className="h-3.5 w-28 bg-gray-200 rounded animate-pulse inline-block" />
                  ) : (
                    <>
                      <span className="font-semibold text-gray-700">
                        {formatPrice(priceEstLow, listing.currency)} – {formatPrice(priceEstHigh, listing.currency)}
                      </span>
                      {aiPrice?.price_verdict && aiPrice.price_verdict !== "no_data" && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          aiPrice.price_verdict === "underpriced"
                            ? "bg-green-100 text-green-700"
                            : aiPrice.price_verdict === "overpriced"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}>
                          {aiPrice.price_verdict === "underpriced"
                            ? t("belowMarket")
                            : aiPrice.price_verdict === "overpriced"
                              ? t("aboveMarket")
                              : t("fairPrice")}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-0.5">· AI</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <FavoriteAction listingId={listing.id} />
                <ShareAction title={listing.title} slug={listing.slug} />
              </div>
            </div>

            {/* Details grid */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("details")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Tag className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {t("category")}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {listing.categories?.name || "—"}
                    </div>
                  </div>
                </div>
                {listing.condition && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Box className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {t("condition")}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {conditionLabel(listing.condition)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {t("location")}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {listing.locations?.name || "Cyprus"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {t("posted")}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatDate(listing.created_at)}
                    </div>
                  </div>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Activity className={`w-4 h-4 ${
                        qualityScore >= 80 ? "text-green-500" :
                        qualityScore >= 50 ? "text-blue-500" : "text-amber-500"
                      }`} />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        {t("listingQuality")}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {qualityScore}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("description")}
                </h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {listing.description}
                </div>
              </div>
            )}

            {/* AI Insights — owner only */}
            {isOwner && (
              <AiInsights listingId={listing.id} onInsightsAction={setAiPrice} />
            )}

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

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="space-y-4">
            {/* Seller card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-20">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md shadow-blue-100">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.display_name || "Seller"}
                      loading="eager"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (profile?.display_name || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profile/${listing.user_id}`}
                      className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors"
                    >
                      {profile?.display_name || "Seller"}
                    </Link>
                    {profile?.verified && (
                      <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    {profile?.is_dealer && (
                      <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full shrink-0">
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
                    <span className="text-xs text-gray-500 ml-1">
                      {sellerRating} ({sellerReviews})
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t("memberSince")} {sellerYear}
                  </p>
                </div>
              </div>

              <ContactButtons
                listingId={listing.id}
                sellerId={listing.user_id}
                listingTitle={listing.title}
                contactPhone={listing.contact_phone}
                whatsappNumber={profile?.whatsapp_number || null}
                telegramUsername={profile?.telegram_username || null}
              />

              {/* Make an Offer / Offer state — non-owners only */}
              {!isOwner && listing.price && listing.status === "active" && (
                existingOffer ? (
                  // Active offer always takes priority over the count check
                  <Link
                    href="/dashboard/offers"
                    className="w-full mt-3 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    {existingOffer.status === "countered" ? t("offerCountered") : t("offerPending")}
                  </Link>
                ) : offerCount >= 2 ? (
                  // No active offer but limit exhausted (both were withdrawn/declined)
                  <div className="w-full mt-3 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    <Tag className="w-4 h-4" />
                    {t("offerLimitReached")}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="w-full mt-3 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    {t("makeOffer")}
                  </button>
                )
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link
                  href={`/profile/${listing.user_id}`}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  {t("viewSellerProfile")}
                </Link>
              </div>
            </div>

            {/* Safety tips */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <p className="text-sm text-amber-800 font-semibold mb-2">
                🛡️ {t("safetyTips")}
              </p>
              <ul className="space-y-1.5 text-xs text-amber-700 leading-relaxed">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  {t("safetyTip1")}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  {t("safetyTip2")}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  {t("safetyTip3")}
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
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
          <section className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {t("similarListings")}
              </h2>
              <Link
                href={`/search?category=${listing.categories?.slug || ""}`}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                {t("viewMore")} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((item: any) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>

    {/* Make an Offer modal */}
    {showOfferModal && listing && (
      <MakeOfferModal
        listingId={listing.id}
        sellerId={listing.user_id}
        listingTitle={listing.title}
        listingPrice={listing.price}
        currency={listing.currency || "EUR"}
        onCloseAction={() => setShowOfferModal(false)}
        onOfferSentAction={() => {
          setExistingOffer({ status: "pending" });
          setOfferCount((c) => c + 1);
          setShowOfferModal(false);
        }}
      />
    )}
    </>
  );
}
