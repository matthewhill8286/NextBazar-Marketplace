"use client";

import {
  ArrowLeft,
  Box,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Loader2,
  MapPin,
  Shield,
  Star,
  Activity,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { createClient } from "@/lib/supabase/client";
import AiInsights, { type InsightsPriceSummary } from "./ai-insights";
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

const LISTING_SELECT = `
  *,
  categories(name, slug, icon),
  subcategories(name, slug),
  locations(name, slug),
  profiles!listings_user_id_fkey(id, display_name, avatar_url, verified, rating, total_reviews, is_dealer, created_at, whatsapp_number, telegram_username),
  listing_images(id, url, thumbnail_url, sort_order)
`;

function formatPrice(p: number | null, currency: string): string {
  if (p === null) return "Contact for price";
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${p.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function conditionLabel(c: string | null): string {
  if (!c) return "—";
  return c.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function ListingDetail({ slug }: { slug: string }) {
  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aiPrice, setAiPrice] = useState<InsightsPriceSummary | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

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
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Listing not found
        </h1>
        <p className="text-gray-500 mb-6">
          This listing may have been removed or the link is incorrect.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Listings
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
            Home
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
                    Sold
                  </span>
                )}
                {listing.is_promoted && (
                  <span className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    Featured
                  </span>
                )}
                {listing.is_urgent && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    Urgent
                  </span>
                )}
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  {listing.categories?.icon} {listing.categories?.name}
                </span>
                {listing.condition && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {conditionLabel(listing.condition)}
                  </span>
                )}
                {listing.price_type === "negotiable" && (
                  <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Negotiable
                  </span>
                )}
                {listing.price_type === "free" && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Free
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
                  {(listing.view_count || 0).toLocaleString()} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-gray-400" />
                  {(listing.favorite_count || 0).toLocaleString()} saved
                </span>
              </div>

              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {formatPrice(listing.price, listing.currency)}
                </span>
                {listing.price_type === "negotiable" && (
                  <span className="text-sm text-green-600 font-medium pb-1">
                    Price negotiable
                  </span>
                )}
              </div>

              {price && isOwner && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-500" />
                    Market value:
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
                            ? "Below Market"
                            : aiPrice.price_verdict === "overpriced"
                              ? "Above Market"
                              : "Fair Price"}
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
                Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Tag className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      Category
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
                        Condition
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
                      Location
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
                      Posted
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatDate(listing.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Activity className={`w-4 h-4 ${
                      qualityScore >= 80 ? "text-green-500" : 
                      qualityScore >= 50 ? "text-blue-500" : "text-amber-500"
                    }`} />
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      Listing Quality
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {qualityScore}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {listing.description}
                </div>
              </div>
            )}

            {/* AI Insights — owner only */}
            {isOwner && (
              <AiInsights listingId={listing.id} onInsights={setAiPrice} />
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
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (profile?.display_name || "U")[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 truncate">
                      {profile?.display_name || "Seller"}
                    </span>
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
                    Member since {sellerYear}
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

              {/* Make an Offer — show to logged-in non-owners when listing has a price */}
              {!isOwner && listing.price && listing.status === "active" && (
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="w-full mt-3 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Make an Offer
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link
                  href={`/search`}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  View all listings from this seller →
                </Link>
              </div>
            </div>

            {/* Safety tips */}
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <p className="text-sm text-amber-800 font-semibold mb-2">
                🛡️ Safety Tips
              </p>
              <ul className="space-y-1.5 text-xs text-amber-700 leading-relaxed">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  Meet in a public place for the exchange
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  Check the item thoroughly before paying
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  Never send money in advance
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  Use in-app messaging for all communication
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
                Similar Listings
              </h2>
              <Link
                href={`/search?category=${listing.categories?.slug || ""}`}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                View more <ChevronRight className="w-3.5 h-3.5" />
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
        onClose={() => setShowOfferModal(false)}
      />
    )}
    </>
  );
}
