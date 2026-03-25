"use client";

import { CheckCircle, Loader2, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { timeAgo } from "@/lib/format-helpers";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { display_name: string | null; avatar_url: string | null } | null;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className="w-8 h-8 transition-colors"
            fill={(hovered || value) >= i ? "#f59e0b" : "none"}
            stroke={(hovered || value) >= i ? "#f59e0b" : "#d1d5db"}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

// ─── Leave Review Form ────────────────────────────────────────────────────────

export function LeaveReviewPrompt({
  listingId,
  sellerId,
  sellerName,
}: {
  listingId: string;
  sellerId: string;
  sellerName: string;
}) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id === sellerId) return; // don't show to seller

      setUserId(user.id);

      const { data } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      setAlreadyReviewed(!!data);
    }
    check();
  }, [listingId, sellerId, supabase.auth.getUser, supabase.from]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || rating === 0 || submitting) return;
    setSubmitting(true);

    await supabase.from("reviews").insert({
      reviewer_id: userId,
      reviewee_id: sellerId,
      listing_id: listingId,
      rating,
      comment: comment.trim() || null,
    });

    setDone(true);
    setSubmitting(false);
  }

  // Not logged in, is the seller, or still loading
  if (userId === null || alreadyReviewed === null) return null;
  // Seller can't review themselves (checked in useEffect)
  if (!userId) return null;

  if (alreadyReviewed || done) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        <p className="text-sm text-green-800 font-medium">
          {done
            ? "Thanks for your review!"
            : "You've already reviewed this seller"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-1">Rate your experience</h3>
      <p className="text-sm text-gray-500 mb-4">
        How was your transaction with{" "}
        <span className="font-medium text-gray-700">{sellerName}</span>?
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-start gap-1.5">
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <span className="text-sm font-medium text-amber-600">
              {RATING_LABELS[rating]}
            </span>
          )}
        </div>

        <textarea
          rows={3}
          placeholder="Share your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
        />

        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Seller Reviews List ──────────────────────────────────────────────────────

export function SellerReviews({
  sellerId,
  avgRating,
  totalReviews,
}: {
  sellerId: string;
  avgRating: number;
  totalReviews: number;
}) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select(
        `id, rating, comment, created_at,
         reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url)`,
      )
      .eq("reviewee_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(20);

    setReviews((data as unknown as Review[]) || []);
    setLoading(false);
  }, [sellerId, supabase.from]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || totalReviews === 0) return null;

  const displayed = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Seller Reviews</h3>
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
          <span className="font-bold text-gray-900">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400">({totalReviews})</span>
        </div>
      </div>

      {/* Rating breakdown bar */}
      <div className="space-y-1.5 mb-5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-2 text-gray-500">{star}</span>
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-5 text-right text-gray-400">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {displayed.map((review) => {
          const initials =
            review.reviewer?.display_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?";

          return (
            <div key={review.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden">
                {review.reviewer?.avatar_url ? (
                  <img
                    src={review.reviewer.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {review.reviewer?.display_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {timeAgo(review.created_at)}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      fill={i <= review.rating ? "#f59e0b" : "none"}
                      stroke={i <= review.rating ? "#f59e0b" : "#d1d5db"}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm text-indigo-600 font-medium hover:underline w-full text-center"
        >
          {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
        </button>
      )}
    </div>
  );
}
