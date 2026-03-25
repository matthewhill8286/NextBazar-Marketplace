"use client";

import {
  Activity,
  ArrowLeft,
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
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import CategoryIcon, {
  getCategoryConfig,
} from "@/app/components/category-icon";
import ListingCard from "@/app/components/listing-card";
import MakeOfferModal from "@/app/components/make-offer-modal";
import { useAuth } from "@/lib/auth-context";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { CONDITION_KEYS } from "@/lib/format-helpers";
import { createClient } from "@/lib/supabase/client";
import type {
  ListingCardRow,
  ListingDetailRow,
} from "@/lib/supabase/supabase.types";
import AiInsights, { type InsightsPriceSummaryAction } from "./ai-insights";
import ImageGallery from "./image-gallery";
import {
  ContactButtons,
  FavoriteAction,
  ReportAction,
  ShareAction,
} from "./listing-actions";
import PriceHistory from "./price-history";
import { LeaveReviewPrompt, SellerReviews } from "./seller-reviews";

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
          <Bone className="w-full aspect-4/3 rounded-2xl" />

          {/* Thumbnail strip */}
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Bone
                key={`${Math.random() + i}`}
                className="w-16 h-16 rounded-xl shrink-0"
              />
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
                <div
                  key={`${Math.random() + i}`}
                  className="bg-gray-50 rounded-xl p-3 flex gap-3 items-center"
                >
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
              <div
                key={`${Math.random() + i}`}
                className="flex gap-2 items-center"
              >
                <Bone className="w-3 h-3 rounded-full bg-amber-200 shrink-0" />
                <Bone
                  className={`h-3.5 bg-amber-200 ${i % 2 === 0 ? "w-full" : "w-4/5"}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  slug: string;
  initialListing?: ListingDetailRow | null;
  initialRelated?: ListingCardRow[];
};

export default function ListingDetail({
  slug,
  initialListing = null,
  initialRelated = [],
}: Props) {
  const t = useTranslations("listing");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const { userId: authUserId } = useAuth();
  const supabase = createClient();
  const [listing, setListing] = useState<ListingDetailRow | null>(
    initialListing,
  );
  const [related, setRelated] = useState<ListingCardRow[]>(initialRelated);
  // Skip loading skeleton when server already provided the data
  const [loading, setLoading] = useState(!initialListing);
  const viewCounted = useRef(false);
  const [notFound, setNotFound] = useState(false);
  const [aiPrice, setAiPrice] = useState<InsightsPriceSummaryAction | null>(
    null,
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [existingOffer, setExistingOffer] = useState<{
    id: string;
    status: string;
    amount: number | null;
    counter_amount: number | null;
    currency: string;
  } | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [shopSlug, setShopSlug] = useState<string | null>(null);

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
    const key = CONDITION_KEYS[c];
    return key
      ? t(key)
      : c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  useEffect(() => {
    async function load() {
      let data = listing; // may already be hydrated from server
      let userId: string | null = null;

      // Use auth context — no getUser() network call needed
      userId = authUserId;
      setCurrentUserId(userId);

      if (!data) {
        // Client-side fallback: fetch listing
        const { data: fetched, error } = await supabase
          .from("listings")
          .select(LISTING_SELECT)
          .eq("slug", slug)
          .single();

        if (error || !fetched) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        data = fetched as ListingDetailRow;
        setListing(data);

        // Also fetch related on client-side fallback
        const { data: rel } = await supabase
          .from("listings")
          .select(`*, categories(name, slug, icon), locations(name, slug)`)
          .eq("status", "active")
          .eq("category_id", data.category_id)
          .neq("id", data.id)
          .order("created_at", { ascending: false })
          .limit(4);
        setRelated((rel || []) as ListingCardRow[]);
      }

      // Track recently viewed (store up to 12 listing IDs, newest first)
      try {
        const stored = localStorage.getItem("recentlyViewed");
        const prev: string[] = stored ? JSON.parse(stored) : [];
        const updated = [
          data.id,
          ...prev.filter((id: string) => id !== data.id),
        ].slice(0, 12);
        localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      } catch {}

      // Reuse userId resolved above — no extra getUser() call needed
      if (userId && userId !== data.user_id) {
        // Fetch offer history and record analytics in parallel
        const offersPromise = supabase
          .from("offers")
          .select("id, status, amount, counter_amount, currency")
          .eq("listing_id", data.id)
          .eq("buyer_id", userId)
          .then(({ data: allOffers }) => {
            if (!allOffers) return;
            setOfferCount(allOffers.length);
            const active = allOffers.find(
              (o) =>
                o.status === "pending" ||
                o.status === "countered" ||
                o.status === "accepted",
            );
            if (active)
              setExistingOffer({
                id: active.id,
                status: active.status,
                amount: active.amount ?? null,
                counter_amount: active.counter_amount ?? null,
                currency: active.currency ?? "EUR",
              });
          });

        const analyticsPromise = fetch("/api/analytics/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id: data.id }),
        }).catch(() => {});

        // Fire both without blocking the loading state
        Promise.all([offersPromise, analyticsPromise]);
      }

      // Increment view count atomically — once per page visit
      if (!viewCounted.current) {
        viewCounted.current = true;
        supabase.rpc("increment_view_count", { p_listing_id: data.id }).then();
      }

      // If seller is a Pro Seller, fetch their shop slug for linking
      if (FEATURE_FLAGS.DEALERS && data.profiles?.is_dealer) {
        supabase
          .from("dealer_shops")
          .select("slug")
          .eq("user_id", data.user_id)
          .single()
          .then(({ data: shop }) => {
            if (shop?.slug) setShopSlug(shop.slug);
          });
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, listing, supabase.from, authUserId]);

  // ── Realtime: listing status (e.g. active → sold) ────────────────────────
  // Fires when the seller marks the item sold or the status changes for any
  // other reason (expiry, moderation, etc.).  Keyed on the listing id so the
  // subscription is torn down and recreated if the slug ever changes.
  useEffect(() => {
    if (!listing?.id) return;
    const channel = supabase
      .channel(`listing-status-${listing.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listing.id}`,
        },
        (payload) => {
          const patch = payload.new as Partial<typeof listing> & { id: string };
          setListing((prev) => (prev ? { ...prev, ...patch } : prev));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing?.id, supabase.channel, supabase.removeChannel]);

  // ── Realtime: buyer's offer on this listing ──────────────────────────────
  // Updates existingOffer.status live so the CTA button (Pending / Countered)
  // reflects the current state without a page reload.  Only runs when we know
  // the current user is the buyer (currentUserId set and != seller).
  useEffect(() => {
    if (!listing?.id || !currentUserId || currentUserId === listing.user_id)
      return;

    const channel = supabase
      .channel(`listing-offer-${listing.id}-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
          filter: `buyer_id=eq.${currentUserId}`,
        },
        (payload) => {
          const patch = payload.new as {
            id: string;
            listing_id: string;
            status: string;
            amount: number;
            counter_amount: number | null;
            currency: string;
          };
          if (patch.listing_id !== listing.id) return;
          const { status } = patch;
          if (
            status === "pending" ||
            status === "countered" ||
            status === "accepted"
          ) {
            setExistingOffer({
              id: patch.id,
              status,
              amount: patch.amount ?? null,
              counter_amount: patch.counter_amount ?? null,
              currency: patch.currency ?? "EUR",
            });
          } else {
            // declined / withdrawn → clear the offer state
            setExistingOffer(null);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing?.id, listing?.user_id, currentUserId]);

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
        <p className="text-gray-500 mb-6">{t("notFoundDesc")}</p>
        <Link
          href="/"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          {t("browseListings")}
        </Link>
      </div>
    );
  }

  // TypeScript guard — if not loading and not notFound, listing is always set
  if (!listing) return null;

  const profile = listing.profiles;
  const sellerRating = profile?.rating || 0;
  const sellerReviews = profile?.total_reviews || 0;
  const sellerYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : 2024;

  const isOwner = !!currentUserId && currentUserId === listing.user_id;

  const price = listing.price;
  // AI-computed market range (falls back to ±15% until insights load)
  const priceEstLow =
    aiPrice && !aiPrice.loading && aiPrice.price_low
      ? aiPrice.price_low
      : price
        ? Math.round(price * 0.85)
        : 0;
  const priceEstHigh =
    aiPrice && !aiPrice.loading && aiPrice.price_high
      ? aiPrice.price_high
      : price
        ? Math.round(price * 1.15)
        : 0;
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
      ((listing.description?.length ?? 0) > 100 ? 20 : 0),
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
          <ImageGallery
            images={galleryImages}
            title={listing.title}
            videoUrl={listing.video_url}
            listingStatus={listing.status}
            offerStatus={existingOffer?.status ?? null}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ═══ LEFT COLUMN ═══ */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title card */}
              <div
                className={`bg-white rounded-2xl border overflow-hidden ${listing.status === "sold" ? "border-gray-200" : "border-gray-100"}`}
              >
                {/* Sold banner — full-width strip at the very top of the card */}
                {listing.status === "sold" && (
                  <div className="flex items-center justify-center gap-3 bg-gray-900 text-white py-3 px-6">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">
                      ━━━
                    </span>
                    <span className="text-sm font-black uppercase tracking-[0.2em]">
                      {t("sold")}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">
                      ━━━
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
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
                    <span
                      className={`${getCategoryConfig(listing.categories?.slug).bg} text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5`}
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
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
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
                      {t("views", {
                        count: (listing.view_count || 0).toLocaleString(),
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-gray-400" />
                      {t("savedCount", {
                        count: (listing.favorite_count || 0).toLocaleString(),
                      })}
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
                        <Shield className="w-3 h-3 text-indigo-500" />
                        {t("marketValue")}
                      </span>
                      {aiMarketLoading ? (
                        <span className="h-3.5 w-28 bg-gray-200 rounded animate-pulse inline-block" />
                      ) : (
                        <>
                          <span className="font-semibold text-gray-700">
                            {formatPrice(priceEstLow, listing.currency)} –{" "}
                            {formatPrice(priceEstHigh, listing.currency)}
                          </span>
                          {aiPrice?.price_verdict &&
                            aiPrice.price_verdict !== "no_data" && (
                              <span
                                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                  aiPrice.price_verdict === "underpriced"
                                    ? "bg-green-100 text-green-700"
                                    : aiPrice.price_verdict === "overpriced"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {aiPrice.price_verdict === "underpriced"
                                  ? t("belowMarket")
                                  : aiPrice.price_verdict === "overpriced"
                                    ? t("aboveMarket")
                                    : t("fairPrice")}
                              </span>
                            )}
                          <span className="text-[10px] text-gray-400 ml-0.5">
                            · AI
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {!isOwner && <FavoriteAction listingId={listing.id} />}
                    <ShareAction title={listing.title} slug={listing.slug} />
                  </div>
                </div>
                {/* end p-6 wrapper */}
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
                        <Activity
                          className={`w-4 h-4 ${
                            qualityScore >= 80
                              ? "text-green-500"
                              : qualityScore >= 50
                                ? "text-indigo-500"
                                : "text-amber-500"
                          }`}
                        />
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

              {/* Vehicle Attributes */}
              {listing.categories?.slug === "vehicles" &&
                listing.attributes &&
                typeof listing.attributes === "object" &&
                !Array.isArray(listing.attributes) &&
                (() => {
                  const rawAttrs = listing.attributes as Record<
                    string,
                    unknown
                  >;
                  // Coerce all values to strings — JSON may store numbers
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
                      format: (v) => `${v}L`,
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
                    <div className="bg-white rounded-2xl p-6 border border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <Car className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                          Vehicle Specifications
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {visible.map((field) => {
                          const Icon = field.icon;
                          const raw = attrs[field.key];
                          const display = field.format
                            ? field.format(raw)
                            : raw;
                          return (
                            <div
                              key={field.key}
                              className="flex items-center gap-3 bg-blue-50/60 rounded-xl p-3.5"
                            >
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Icon className="w-4 h-4 text-blue-500" />
                              </div>
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium">
                                  {field.label}
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
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
                <AiInsights
                  listingId={listing.id}
                  onInsightsAction={setAiPrice}
                />
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
                  <div className="w-14 h-14 bg-linear-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md shadow-indigo-100">
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
                        href={
                          shopSlug
                            ? `/shop/${shopSlug}`
                            : `/profile/${listing.user_id}`
                        }
                        className="font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors"
                      >
                        {profile?.display_name || "Seller"}
                      </Link>
                      {profile?.verified && (
                        <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                      {FEATURE_FLAGS.DEALERS && profile?.is_dealer && (
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

                {!isOwner && (
                  <ContactButtons
                    listingId={listing.id}
                    sellerId={listing.user_id}
                    listingTitle={listing.title}
                    contactPhone={listing.contact_phone}
                    whatsappNumber={profile?.whatsapp_number || null}
                    telegramUsername={profile?.telegram_username || null}
                  />
                )}

                {/* Make an Offer / Offer state — non-owners only */}
                {!isOwner && listing.price && listing.status === "active" && (
                  <div className="mt-3">
                    {existingOffer ? (
                      existingOffer.status === "accepted" ? (
                        // ── Offer accepted ───────────────────────────────
                        <div className="w-full rounded-xl overflow-hidden border-2 border-emerald-200">
                          <div className="bg-emerald-500 px-4 py-2 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                              Offer accepted!
                            </span>
                          </div>
                          <div className="bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="text-xs text-emerald-700">
                              <span className="block text-[11px] text-emerald-500 mb-0.5">
                                Accepted amount
                              </span>
                              <span className="font-extrabold text-emerald-800 text-base">
                                {existingOffer.amount != null
                                  ? `${existingOffer.currency === "EUR" ? "€" : existingOffer.currency}${existingOffer.amount.toLocaleString()}`
                                  : "—"}
                              </span>
                            </div>
                            <Link
                              href={`/dashboard/offers${existingOffer?.id ? `?offer=${existingOffer.id}` : ""}`}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      ) : existingOffer.status === "countered" ? (
                        // ── Counter offer received ────────────────────────
                        <Link
                          href={`/dashboard/offers${existingOffer?.id ? `?offer=${existingOffer.id}` : ""}`}
                          className="block w-full rounded-xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-300 transition-all group"
                        >
                          <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                              Counter offer received
                            </span>
                          </div>
                          <div className="bg-indigo-50 group-hover:bg-indigo-100 transition-colors px-4 py-3 flex items-center justify-between gap-3">
                            <div className="text-xs text-indigo-600">
                              <span className="block text-[11px] text-indigo-400 mb-0.5">
                                Your offer
                              </span>
                              <span className="font-bold">
                                {existingOffer.amount != null
                                  ? `${existingOffer.currency === "EUR" ? "€" : existingOffer.currency}${existingOffer.amount.toLocaleString()}`
                                  : "—"}
                              </span>
                            </div>
                            <div className="w-px h-6 bg-indigo-200" />
                            <div className="text-xs text-indigo-600">
                              <span className="block text-[11px] text-indigo-400 mb-0.5">
                                Counter
                              </span>
                              <span className="font-extrabold text-indigo-700">
                                {existingOffer.counter_amount != null
                                  ? `${existingOffer.currency === "EUR" ? "€" : existingOffer.currency}${existingOffer.counter_amount.toLocaleString()}`
                                  : "—"}
                              </span>
                            </div>
                            <span className="ml-auto text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                              Respond →
                            </span>
                          </div>
                        </Link>
                      ) : (
                        // ── Offer pending ─────────────────────────────────
                        <Link
                          href={`/dashboard/offers${existingOffer?.id ? `?offer=${existingOffer.id}` : ""}`}
                          className="block w-full rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-300 transition-all group"
                        >
                          <div className="bg-amber-500 px-4 py-2 flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-amber-100 shrink-0" />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                              Offer pending
                            </span>
                          </div>
                          <div className="bg-amber-50 group-hover:bg-amber-100 transition-colors px-4 py-3 flex items-center justify-between gap-3">
                            <div className="text-xs text-amber-700">
                              <span className="block text-[11px] text-amber-500 mb-0.5">
                                Your offer
                              </span>
                              <span className="font-extrabold text-amber-800 text-base">
                                {existingOffer.amount != null
                                  ? `${existingOffer.currency === "EUR" ? "€" : existingOffer.currency}${existingOffer.amount.toLocaleString()}`
                                  : "—"}
                              </span>
                            </div>
                            <span className="ml-auto text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                              View →
                            </span>
                          </div>
                        </Link>
                      )
                    ) : offerCount >= 2 ? (
                      // ── Offer limit reached ───────────────────────────
                      <div className="w-full py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                        <Tag className="w-4 h-4" />
                        {t("offerLimitReached")}
                      </div>
                    ) : (
                      // ── Make an offer ─────────────────────────────────
                      <button
                        onClick={() => setShowOfferModal(true)}
                        className="w-full py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        {t("makeOffer")}
                      </button>
                    )}
                  </div>
                )}

                {/* Sold state — shown instead of CTA when listing is no longer active */}
                {!isOwner && listing.status === "sold" && (
                  <div className="mt-3 w-full py-3 px-4 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed select-none">
                    <span className="text-base">🏷️</span>
                    This item has been sold
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <Link
                    href={
                      shopSlug
                        ? `/shop/${shopSlug}`
                        : `/profile/${listing.user_id}`
                    }
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    {shopSlug ? t("visitShop") : t("viewSellerProfile")}
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
                  className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
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
          onOfferSentAction={(offerId, amt, cur) => {
            setExistingOffer({
              id: offerId,
              status: "pending",
              amount: amt,
              counter_amount: null,
              currency: cur,
            });
            setOfferCount((c) => c + 1);
            setShowOfferModal(false);
          }}
        />
      )}
    </>
  );
}
