"use client";

import { CheckCircle, Loader2, Star, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  offerId: string;
  listingId: string;
  revieweeId: string;
  revieweeName: string;
  onCloseAction: () => void;
  onReviewedAction: () => void;
};

export default function LeaveReviewModal({
  offerId,
  listingId,
  revieweeId,
  revieweeName,
  onCloseAction,
  onReviewedAction,
}: Props) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  async function submit() {
    if (!rating) return;
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      listing_id: listingId,
      offer_id: offerId,
      rating,
      comment: comment.trim() || null,
    });

    if (err) {
      setError(
        "Couldn't submit review. You may have already reviewed this transaction.",
      );
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => {
      onReviewedAction();
      onCloseAction();
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Leave a Review</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              How was your experience with {revieweeName}?
            </p>
          </div>
          <button
            onClick={onCloseAction}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-gray-900">Review submitted!</p>
              <p className="text-sm text-gray-500">Thanks for your feedback.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Star rating */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(n)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          n <= (hovered || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200 fill-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    rating ? "text-amber-600" : "text-gray-400"
                  }`}
                >
                  {LABELS[hovered || rating] || "Tap to rate"}
                </span>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Comment{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  placeholder={`Share details about your experience with ${revieweeName}…`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {comment.length}/500
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={!rating || loading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
