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
  onReviewedAction: (rating: number) => void;
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
      onReviewedAction(rating);
      onCloseAction();
    }, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white shadow-2xl w-full max-w-md overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Leave a review"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e8e6e3]">
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Leave a Review</h2>
            <p className="text-sm text-[#6b6560] mt-0.5">
              How was your experience with {revieweeName}?
            </p>
          </div>
          <button
            onClick={onCloseAction}
            className="p-2 rounded-full hover:bg-[#f0eeeb] transition-colors text-[#8a8280]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-[#1a1a1a]">Review submitted!</p>
              <p className="text-sm text-[#6b6560]">
                Thanks for your feedback.
              </p>
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
                            : "text-[#8a8280] fill-[#e8e6e3]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    rating ? "text-amber-600" : "text-[#8a8280]"
                  }`}
                >
                  {LABELS[hovered || rating] || "Tap to rate"}
                </span>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1.5">
                  Comment{" "}
                  <span className="text-[#8a8280] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  placeholder={`Share details about your experience with ${revieweeName}…`}
                  className="w-full px-3.5 py-2.5 border border-[#e8e6e3] text-sm outline-none focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 resize-none"
                />
                <div className="text-right text-xs text-[#8a8280] mt-1">
                  {comment.length}/500
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 ">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={!rating || loading}
                className="w-full py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
