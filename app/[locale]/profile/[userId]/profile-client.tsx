"use client";

import { Calendar, ChevronRight, Package, Shield, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import ListingCard from "@/app/components/listing-card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { timeAgo } from "@/lib/format-helpers";
import type { SearchListing } from "@/lib/supabase/supabase.types";

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  is_dealer: boolean;
  created_at: string;
  rating: number | null;
  total_reviews: number | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { display_name: string | null; avatar_url: string | null } | null;
};

type Props = {
  profile: Profile;
  listings: SearchListing[];
  reviews: Review[];
  reviewCount: number;
  avgRating: number;
};

function memberSince(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function ProfileClient({
  profile,
  listings,
  reviews,
  reviewCount,
  avgRating,
}: Props) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shrink-0 overflow-hidden shadow-lg">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.display_name}
                </h1>
                {profile.verified && (
                  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                    <Shield className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
                {FEATURE_FLAGS.DEALERS && profile.is_dealer && (
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-100">
                    🏪 Pro Seller
                  </span>
                )}
              </div>

              {/* Rating */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <StarRow rating={avgRating} size="sm" />
                  <span className="font-bold text-gray-900">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {profile.bio && (
                <p className="text-sm text-gray-600 mt-2 max-w-lg">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {memberSince(profile.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {listings.length} active listing
                  {listings.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Listings */}
        {listings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Active Listings
              </h2>
              <span className="text-sm text-gray-400">
                {listings.length} item{listings.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing as any} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviewCount > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Reviews
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({reviewCount})
              </span>
            </h2>

            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              {/* Big score */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-2 text-center">
                <span className="text-5xl font-extrabold text-gray-900">
                  {avgRating.toFixed(1)}
                </span>
                <StarRow rating={avgRating} size="lg" />
                <span className="text-sm text-gray-400">
                  {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Distribution */}
              <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
                {dist.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-3 text-gray-500 text-right">{star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 shrink-0" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-gray-400 text-xs">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review cards */}
            <div className="space-y-4">
              {displayedReviews.map((review) => {
                const rev = review.reviewer;
                const initials2 =
                  rev?.display_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?";
                return (
                  <div
                    key={review.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
                      {rev?.avatar_url ? (
                        <img
                          src={rev.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials2
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-medium text-gray-900 text-sm">
                          {rev?.display_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {timeAgo(review.created_at)}
                        </span>
                      </div>
                      <StarRow rating={review.rating} />
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {reviews.length > 4 && (
              <button
                onClick={() => setShowAllReviews((v) => !v)}
                className="mt-4 flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline mx-auto"
              >
                {showAllReviews
                  ? "Show fewer reviews"
                  : `Show all ${reviews.length} reviews`}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${showAllReviews ? "rotate-90" : ""}`}
                />
              </button>
            )}
          </section>
        )}

        {listings.length === 0 && reviewCount === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-gray-500 text-sm">
              This seller hasn't posted any listings yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
