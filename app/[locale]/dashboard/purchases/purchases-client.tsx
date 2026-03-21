"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Star,
  Shield,
  CheckCircle,
  ExternalLink,
  Calendar,
  Tag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LeaveReviewModal from "@/app/components/leave-review-modal";

type Purchase = {
  id: string; // offer id
  amount: number;
  counter_amount: number | null;
  currency: string;
  status: string;
  message: string | null;
  counter_message: string | null;
  created_at: string;
  responded_at: string | null;
  listings: {
    id: string;
    title: string;
    slug: string;
    primary_image_url: string | null;
    price: number | null;
    currency: string;
    status: string;
    categories: { name: string; icon: string } | { name: string; icon: string }[] | null;
    locations: { name: string } | { name: string }[] | null;
  } | null;
  seller: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  } | null;
};

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

function formatPrice(amount: number, currency: string) {
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${amount.toLocaleString()}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function PurchaseCard({
  purchase,
  userId,
}: {
  purchase: Purchase;
  userId: string;
}) {
  const supabase = createClient();
  const listing = purchase.listings;
  const seller = purchase.seller;
  const cat = unwrap(listing?.categories);
  const loc = unwrap(listing?.locations);

  // The final agreed price: counter if the buyer accepted a counter, otherwise original offer
  const finalAmount = purchase.counter_amount ?? purchase.amount;

  const [showReview, setShowReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingRating, setExistingRating] = useState<number | null>(null);

  useEffect(() => {
    if (!userId || !seller) return;
    supabase
      .from("reviews")
      .select("rating")
      .eq("offer_id", purchase.id)
      .eq("reviewer_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHasReviewed(true);
          setExistingRating(data.rating);
        }
      });
  }, [purchase.id, userId]);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
        <div className="flex gap-4 p-4">
          {/* Listing thumbnail */}
          <Link
            href={listing ? `/listing/${listing.slug}` : "#"}
            className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative block"
          >
            {listing?.primary_image_url ? (
              <Image
                src={listing.primary_image_url}
                alt={listing.title || ""}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {cat?.icon || "📦"}
              </div>
            )}
            {listing?.status === "sold" && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-gray-900 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  Sold
                </span>
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={listing ? `/listing/${listing.slug}` : "#"}
                  className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors block truncate"
                >
                  {listing?.title || "Listing"}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                  {cat && <span>{cat.icon} {cat.name}</span>}
                  {loc && <><span>·</span><span>{loc.name}</span></>}
                </div>
              </div>

              {/* Price paid */}
              <div className="shrink-0 text-right">
                <div className="text-lg font-extrabold text-gray-900">
                  {formatPrice(finalAmount, purchase.currency)}
                </div>
                {listing?.price && listing.price !== finalAmount && (
                  <div className="text-xs text-gray-400 line-through">
                    {formatPrice(listing.price, purchase.currency)}
                  </div>
                )}
              </div>
            </div>

            {/* Seller row */}
            {seller && (
              <Link
                href={`/profile/${seller.id}`}
                className="flex items-center gap-1.5 mt-2 w-fit group"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0 overflow-hidden">
                  {seller.avatar_url ? (
                    <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    seller.display_name[0].toUpperCase()
                  )}
                </div>
                <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                  {seller.display_name}
                </span>
                {seller.verified && <Shield className="w-3 h-3 text-blue-500" />}
              </Link>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Purchased {formatDate(purchase.responded_at)}
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Offered {formatPrice(purchase.amount, purchase.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: review + view listing */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
          {/* Review state */}
          {seller && listing ? (
            hasReviewed ? (
              <div className="flex items-center gap-2">
                <StarRow rating={existingRating ?? 0} />
                <span className="text-xs text-gray-400">Your review</span>
              </div>
            ) : (
              <button
                onClick={() => setShowReview(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Leave a review
              </button>
            )
          ) : (
            <div />
          )}

          <Link
            href={listing ? `/listing/${listing.slug}` : "#"}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View listing
          </Link>
        </div>
      </div>

      {showReview && seller && listing && (
        <LeaveReviewModal
          offerId={purchase.id}
          listingId={listing.id}
          revieweeId={seller.id}
          revieweeName={seller.display_name}
          onCloseAction={() => setShowReview(false)}
          onReviewedAction={() => {
            setHasReviewed(true);
            setShowReview(false);
          }}
        />
      )}
    </>
  );
}

export default function PurchasesClient({
  userId,
  purchases,
}: {
  userId: string;
  purchases: Purchase[];
}) {
  const totalSpent = purchases.reduce((sum, p) => {
    return sum + (p.counter_amount ?? p.amount);
  }, 0);

  const currencySymbol = purchases[0]?.currency === "EUR" ? "€" : (purchases[0]?.currency ?? "€");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All listings you've successfully bought.
          </p>
        </div>
        {purchases.length > 0 && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold text-gray-900">
              {currencySymbol}{totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">total spent</div>
          </div>
        )}
      </div>

      {/* Summary strip */}
      {purchases.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{purchases.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Item{purchases.length !== 1 ? "s" : ""} bought</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {purchases.filter((p) => {
                // reviewed = has offer in reviewed state, we check via hasReviewed in each card
                // just show pending reviews as a nudge
                return true;
              }).length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Transactions</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {purchases.reduce((savings, p) => {
                const listed = p.listings?.price ?? 0;
                const paid = p.counter_amount ?? p.amount;
                return savings + Math.max(0, listed - paid);
              }, 0) > 0
                ? `${currencySymbol}${purchases.reduce((savings, p) => {
                    const listed = p.listings?.price ?? 0;
                    const paid = p.counter_amount ?? p.amount;
                    return savings + Math.max(0, listed - paid);
                  }, 0).toLocaleString()}`
                : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Saved vs asking</div>
          </div>
        </div>
      )}

      {/* List */}
      {purchases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No purchases yet</h3>
          <p className="text-gray-500 text-sm mb-6">
            When a seller accepts one of your offers, it will appear here.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <PurchaseCard key={purchase.id} purchase={purchase} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
