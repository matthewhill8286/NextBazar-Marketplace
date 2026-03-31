"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Loader2,
  MessageCircle,
  RotateCcw,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import LeaveReviewModal from "@/app/components/leave-review-modal";
import { ConfirmDialog } from "@/app/components/ui";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 10;
const TERMINAL_STATUSES = ["withdrawn", "declined", "expired"];

type Offer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: string;
  message: string | null;
  counter_amount: number | null;
  counter_message: string | null;
  responded_at: string | null;
  expires_at: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    slug: string;
    primary_image_url: string | null;
    price: number | null;
    currency: string;
  } | null;
  buyer?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  seller?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

type Props = {
  userId: string;
  focusOfferId?: string;
  initialTab?: "received" | "sent";
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700" },
  accepted: { label: "Accepted", bg: "bg-green-50", text: "text-green-700" },
  declined: { label: "Declined", bg: "bg-red-50", text: "text-red-600" },
  countered: {
    label: "Countered",
    bg: "bg-[#faf9f7]",
    text: "text-[#666]",
  },
  withdrawn: { label: "Withdrawn", bg: "bg-[#f0eeeb]", text: "text-[#6b6560]" },
  expired: { label: "Expired", bg: "bg-[#f0eeeb]", text: "text-[#6b6560]" },
};

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#bbb] to-[#faf9f7]0 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 1) return "< 1h left";
  if (hrs < 24) return `${hrs}h left`;
  return `${Math.floor(hrs / 24)}d left`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-[#8a8280] fill-[#e8e6e3]"}`}
        />
      ))}
    </div>
  );
}

function Pagination({
  page,
  total,
  onPageAction,
}: {
  page: number;
  total: number;
  onPageAction: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-[#8a8280]">
        Page {page + 1} of {totalPages} · {total} offer{total !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageAction(page - 1)}
          disabled={page === 0}
          className="p-1.5 border border-[#e8e6e3] text-[#6b6560] hover:bg-[#faf9f7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={`pagination-${i}`}
            type="button"
            onClick={() => onPageAction(i)}
            className={`w-7 h-7 text-xs font-medium transition-colors ${
              i === page
                ? "bg-[#2C2826] text-white"
                : "border border-[#e8e6e3] text-[#666] hover:bg-[#faf9f7]"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageAction(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 border border-[#e8e6e3] text-[#6b6560] hover:bg-[#faf9f7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  isSeller,
  userId,
  onUpdateAction,
  onDeleteAction,
  focused = false,
}: {
  offer: Offer;
  isSeller: boolean;
  userId: string;
  onUpdateAction: (id: string, patch: Partial<Offer>) => void;
  onDeleteAction: (id: string) => void;
  focused?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const sym = offer.currency === "EUR" ? "€" : offer.currency;
  const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
  const [loading, setLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [expanded, setExpanded] = useState(focused);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "accepted" | "declined" | "withdrawn" | "countered";
    extras?: Record<string, unknown>;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const listing = offer.listings;
  const person = isSeller ? offer.buyer : offer.seller;
  const isTerminal = TERMINAL_STATUSES.includes(offer.status);

  useEffect(() => {
    if (focused && cardRef.current) {
      setTimeout(
        () =>
          cardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        300,
      );
    }
  }, [focused]);

  useEffect(() => {
    if (offer.status !== "accepted") return;
    supabase
      .from("reviews")
      .select("rating")
      .eq("offer_id", offer.id)
      .eq("reviewer_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHasReviewed(true);
          setExistingRating(data.rating);
        }
      });
  }, [supabase, offer.id, offer.status, userId]);

  async function respond(status: string, extras: Record<string, unknown> = {}) {
    setLoading(status);
    setActionError(null);
    try {
      const { error } = await supabase
        .from("offers")
        .update({ status, responded_at: new Date().toISOString(), ...extras })
        .eq("id", offer.id);
      if (error) {
        setActionError("Couldn't update offer. Please try again.");
        toast.error("Failed to update offer");
        return;
      }
      onUpdateAction(offer.id, {
        status,
        responded_at: new Date().toISOString(),
        ...extras,
      } as Partial<Offer>);
      setShowCounter(false);

      const toastMap: Record<string, string> = {
        accepted: "Offer accepted",
        declined: "Offer declined",
        countered: "Counter offer sent",
        withdrawn: "Offer withdrawn",
      };
      toast.success(toastMap[status] || "Offer updated");
      router.refresh();
    } catch {
      setActionError("Couldn't update offer. Please try again.");
      toast.error("Failed to update offer");
    } finally {
      setLoading(null);
    }
  }

  async function handleConfirmedAction() {
    if (!confirmAction) return;
    const { type, extras } = confirmAction;
    setConfirmAction(null);
    await respond(type, extras || {});
  }

  async function handleDelete() {
    setLoading("delete");
    setActionError(null);
    try {
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", offer.id);
      if (error) {
        setActionError("Couldn't delete offer. Please try again.");
        toast.error("Failed to delete offer");
        setDeleteConfirm(false);
        return;
      }
      onDeleteAction(offer.id);
      toast.success("Offer removed");
    } catch {
      setActionError("Couldn't delete offer. Please try again.");
      toast.error("Failed to delete offer");
      setDeleteConfirm(false);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`bg-white border overflow-hidden transition-colors ${
          focused
            ? "border-[#e8e6e3] ring-2 ring-[#f0eeeb]"
            : "border-[#e8e6e3]"
        }`}
      >
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#faf9f7]/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Listing thumbnail */}
          <div className="w-14 h-14 overflow-hidden bg-[#f0eeeb] shrink-0 relative">
            {listing?.primary_image_url ? (
              <Image
                src={listing.primary_image_url}
                alt={listing.title || ""}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">
                📦
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={listing ? `/listing/${listing.slug}` : "#"}
              className="font-medium text-[#1a1a1a] hover:text-[#666] transition-colors text-sm truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {listing?.title || "Listing"}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6b6560] flex-wrap">
              {person && (
                <span className="flex items-center gap-1">
                  <Avatar
                    name={person.display_name}
                    avatarUrl={person.avatar_url}
                  />
                  {isSeller ? "from" : "to"} {person.display_name}
                </span>
              )}
              <span>·</span>
              <span className="font-semibold text-[#1a1a1a] text-sm">
                {sym}
                {offer.amount.toLocaleString()}
              </span>
              {listing?.price && (
                <span className="text-[#8a8280]">
                  (asking {sym}
                  {listing.price.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
            >
              {cfg.label}
            </span>
            {offer.status === "pending" && (
              <span className="flex items-center gap-1 text-xs text-[#8a8280]">
                <Clock className="w-3 h-3" />
                {timeLeft(offer.expires_at)}
              </span>
            )}
            {offer.status === "accepted" && hasReviewed && existingRating && (
              <StarRating rating={existingRating} />
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-[#8a8280]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8a8280]" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-[#faf9f7] pt-4 space-y-3">
            {offer.message && (
              <div className="bg-[#faf9f7] p-3">
                <p className="text-xs text-[#6b6560] mb-1 font-medium">
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Buyer&apos;s message
                </p>
                <p className="text-sm text-[#666]">{offer.message}</p>
              </div>
            )}

            {offer.counter_amount && (
              <div className="bg-[#faf9f7] p-3">
                <p className="text-xs text-[#666] mb-1 font-medium">
                  Counter offer: {sym}
                  {offer.counter_amount.toLocaleString()}
                </p>
                {offer.counter_message && (
                  <p className="text-sm text-[#666]">{offer.counter_message}</p>
                )}
              </div>
            )}

            {/* Review prompt for accepted offers */}
            {offer.status === "accepted" && person && (
              <div
                className={`p-3 flex items-center justify-between gap-3 ${
                  hasReviewed
                    ? "bg-amber-50 border border-amber-100"
                    : "bg-green-50 border border-green-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star
                    className={`w-4 h-4 ${hasReviewed ? "text-amber-500 fill-amber-500" : "text-green-600"}`}
                  />
                  <div>
                    <p
                      className={`text-xs font-medium ${hasReviewed ? "text-amber-800" : "text-green-800"}`}
                    >
                      {hasReviewed
                        ? "You reviewed this transaction"
                        : "How was it?"}
                    </p>
                    <p
                      className={`text-xs ${hasReviewed ? "text-amber-600" : "text-green-600"}`}
                    >
                      {hasReviewed
                        ? existingRating !== null
                          ? `You gave ${person.display_name} ${existingRating} star${existingRating !== 1 ? "s" : ""}`
                          : ""
                        : `Leave a review for ${person.display_name}`}
                    </p>
                  </div>
                </div>
                {!hasReviewed && (
                  <button
                    disabled={loading === "review"}
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="shrink-0 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5"
                  >
                    <Star className="w-3 h-3" />
                    Review
                  </button>
                )}
              </div>
            )}

            {/* Seller actions on pending offer */}
            {isSeller && offer.status === "pending" && (
              <div className="space-y-2">
                {!showCounter ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: "accepted" })}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading === "accepted" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCounter(true)}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#e8e6e3] bg-[#faf9f7] text-[#666] text-sm font-medium hover:bg-[#f0eeeb] transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Counter
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: "declined" })}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {loading === "declined" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-[#666]">
                      Your counter offer amount
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8280]">
                        {sym}
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 border border-[#e8e6e3] text-sm outline-none focus-visible:border-[#1a1a1a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Amount"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder="Optional message"
                      className="w-full px-3 py-2.5 border border-[#e8e6e3] text-sm outline-none focus-visible:border-[#1a1a1a] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: "countered",
                            extras: {
                              counter_amount: Number(counterAmount),
                              counter_message: counterMessage || null,
                            },
                          })
                        }
                        disabled={!counterAmount || !!loading}
                        className="flex-1 py-2.5 bg-[#2C2826] text-white text-sm font-medium hover:bg-[#3D3633] transition-colors disabled:opacity-50"
                      >
                        {loading === "countered" ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          "Send Counter"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCounter(false)}
                        className="px-4 py-2.5 border border-[#e8e6e3] text-sm text-[#666] hover:bg-[#faf9f7]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buyer actions */}
            {!isSeller &&
              (offer.status === "pending" || offer.status === "countered") && (
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: "withdrawn" })}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 text-sm text-[#6b6560] hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {loading === "withdrawn" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Withdraw offer
                </button>
              )}

            {!isSeller &&
              offer.status === "countered" &&
              offer.counter_amount != null && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction({ type: "accepted" })}
                    disabled={!!loading}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading === "accepted" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accept {sym}
                    {offer.counter_amount.toLocaleString()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction({ type: "declined" })}
                    disabled={!!loading}
                    className="flex-1 py-2.5 border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading === "declined" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Decline
                  </button>
                </div>
              )}

            {/* Delete button — only for terminal offers */}
            {isTerminal && (
              <div className="pt-1 border-t border-[#faf9f7]">
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6b6560] flex-1">
                      Remove this offer permanently?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading === "delete"}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {loading === "delete" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : null}
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-1.5 border border-[#e8e6e3] text-xs text-[#666] hover:bg-[#faf9f7] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-[#8a8280] hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove from history
                  </button>
                )}
              </div>
            )}

            {/* Error message */}
            {actionError && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2">
                {actionError}
              </p>
            )}
          </div>
        )}
      </div>

      {showReviewModal && person && listing && (
        <LeaveReviewModal
          offerId={offer.id}
          listingId={listing.id}
          revieweeId={person.id}
          revieweeName={person.display_name}
          onCloseAction={() => setShowReviewModal(false)}
          onReviewedAction={(rating) => {
            setHasReviewed(true);
            setExistingRating(rating);
          }}
        />
      )}

      {/* ── Confirm dialogs for offer actions ── */}
      <ConfirmDialog
        open={confirmAction?.type === "accepted"}
        title="Accept this offer?"
        description={`You'll agree to sell for ${sym}${
          offer.status === "countered" && offer.counter_amount
            ? offer.counter_amount.toLocaleString()
            : offer.amount.toLocaleString()
        }. The ${isSeller ? "buyer" : "seller"} will be notified.`}
        icon={
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-600" />
          </div>
        }
        confirmLabel="Accept"
        confirmClassName="bg-green-600 hover:bg-green-700"
        loading={loading === "accepted"}
        onConfirm={handleConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === "declined"}
        title="Decline this offer?"
        description={`The ${isSeller ? "buyer" : "seller"} will be notified that you declined.`}
        icon={
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <X className="w-6 h-6 text-red-600" />
          </div>
        }
        confirmLabel="Decline"
        confirmClassName="bg-red-600 hover:bg-red-700"
        loading={loading === "declined"}
        onConfirm={handleConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === "countered"}
        title="Send counter offer?"
        description={`You'll counter with ${sym}${
          confirmAction?.extras?.counter_amount
            ? Number(confirmAction.extras.counter_amount).toLocaleString()
            : "—"
        }. The buyer will be notified.`}
        icon={
          <div className="w-12 h-12 rounded-full bg-[#faf9f7] flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-[#666]" />
          </div>
        }
        confirmLabel="Send Counter"
        confirmClassName="bg-[#2C2826] hover:bg-[#3D3633]"
        loading={loading === "countered"}
        onConfirm={handleConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === "withdrawn"}
        title="Withdraw this offer?"
        description={`Your offer of ${sym}${offer.amount.toLocaleString()} will be withdrawn and the seller will be notified.`}
        icon={
          <div className="w-12 h-12 rounded-full bg-[#f0eeeb] flex items-center justify-center">
            <X className="w-6 h-6 text-[#6b6560]" />
          </div>
        }
        confirmLabel="Withdraw"
        confirmClassName="bg-red-600 hover:bg-red-700"
        loading={loading === "withdrawn"}
        onConfirm={handleConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}

// ─── Public card exports ──────────────────────────────────────────────────────
// Thin wrappers that fix the `isSeller` flag so callers (and tests) don't have
// to know about the internal prop.  Both receive the same public props.

type OfferCardPublicProps = {
  offer: Offer;
  userId: string;
  onUpdateAction: (id: string, patch: Partial<Offer>) => void;
  onDeleteAction: (id: string) => void;
  focused?: boolean;
};

/** Offer card rendered from the **buyer's** perspective (Withdraw / Accept counter / Decline counter). */
export function BuyerOfferCard(props: OfferCardPublicProps) {
  return <OfferCard {...props} isSeller={false} />;
}

/** Offer card rendered from the **seller's** perspective (Accept / Counter / Decline). */
export function SellerOfferCard(props: OfferCardPublicProps) {
  return <OfferCard {...props} isSeller={true} />;
}

export default function OffersClient({
  userId,
  focusOfferId,
  initialTab,
}: Props) {
  const supabase = createClient();

  const [tab, setTab] = useState<"received" | "sent">(initialTab ?? "received");
  const [receivedPage, setReceivedPage] = useState(0);
  const [sentPage, setSentPage] = useState(0);
  const [received, setReceived] = useState<Offer[]>([]);
  const [sent, setSent] = useState<Offer[]>([]);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentTotal, setSentTotal] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  const RECEIVED_SELECT = `*, listings(id,title,slug,primary_image_url,price,currency), buyer:profiles!offers_buyer_id_fkey(id,display_name,avatar_url)`;
  const SENT_SELECT = `*, listings(id,title,slug,primary_image_url,price,currency), seller:profiles!offers_seller_id_fkey(id,display_name,avatar_url)`;

  const fetchPage = useCallback(
    async (which: "received" | "sent", page: number) => {
      setPageLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (which === "received") {
        const { data, count } = await supabase
          .from("offers")
          .select(RECEIVED_SELECT, { count: "exact" })
          .eq("seller_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to);
        setReceived(data || []);
        setReceivedTotal(count ?? 0);
      } else {
        const { data, count } = await supabase
          .from("offers")
          .select(SENT_SELECT, { count: "exact" })
          .eq("buyer_id", userId)
          .order("created_at", { ascending: false })
          .range(from, to);
        setSent(data || []);
        setSentTotal(count ?? 0);
      }
      setPageLoading(false);
    },
    [supabase, userId],
  );

  // Initial load for both tabs
  useEffect(() => {
    fetchPage("received", 0);
    fetchPage("sent", 0);
  }, [fetchPage]);

  // Reload when page changes
  useEffect(() => {
    fetchPage("received", receivedPage);
  }, [fetchPage, receivedPage]);
  useEffect(() => {
    fetchPage("sent", sentPage);
  }, [fetchPage, sentPage]);

  // ── Realtime offer updates ──────────────────────────────────────────────
  // Without this, the buyer's "Sent" tab stays stale after the seller counters
  // (or vice-versa) because router.refresh() doesn't re-run fetchPage effects.
  //
  // We intentionally do NOT use server-side column filters like
  // `buyer_id=eq.${userId}` on UPDATE events.  PostgreSQL's WAL record for an
  // UPDATE only contains changed columns + the primary key (without REPLICA
  // IDENTITY FULL), so the Supabase server-side filter silently drops events
  // where `buyer_id`/`seller_id` wasn't one of the modified columns — which is
  // exactly the case when only `status`, `counter_amount`, etc. change.
  //
  // Instead, we subscribe to all offer UPDATEs that RLS allows and route them
  // to the correct list client-side based on the user's role in the offer.
  // The migration 20260323000002 adds REPLICA IDENTITY FULL for belt-and-suspenders.
  // Route offer UPDATE events to sent/received lists based on the user's role.
  // No server-side column filter: buyer_id/seller_id are dropped from WAL UPDATE
  // changesets when those columns aren't modified — we filter client-side instead.
  useRealtimeTable<Offer>({
    channelName: `offers-realtime-${userId}`,
    table: "offers",
    event: "UPDATE",
    onPayload: ({ new: patch }) => {
      const p = patch as Partial<Offer> & {
        id: string;
        buyer_id: string;
        seller_id: string;
      };
      if (p.buyer_id === userId)
        setSent((prev) =>
          prev.map((o) => (o.id === p.id ? { ...o, ...p } : o)),
        );
      if (p.seller_id === userId)
        setReceived((prev) =>
          prev.map((o) => (o.id === p.id ? { ...o, ...p } : o)),
        );
    },
    enabled: !!userId,
  });

  // If there's a focused offer but no explicit tab, auto-detect from data
  useEffect(() => {
    if (!focusOfferId || initialTab) return;
    if (sent.some((o) => o.id === focusOfferId)) setTab("sent");
  }, [focusOfferId, initialTab, sent]);

  function updateOffer(
    list: Offer[],
    id: string,
    patch: Partial<Offer>,
  ): Offer[] {
    return list.map((o) => (o.id === id ? { ...o, ...patch } : o));
  }

  function handleDelete(id: string) {
    if (tab === "received") {
      setReceived((prev) => prev.filter((o) => o.id !== id));
      setReceivedTotal((n) => n - 1);
    } else {
      setSent((prev) => prev.filter((o) => o.id !== id));
      setSentTotal((n) => n - 1);
    }
  }

  const offers = tab === "received" ? received : sent;
  const total = tab === "received" ? receivedTotal : sentTotal;
  const page = tab === "received" ? receivedPage : sentPage;
  const setPage = tab === "received" ? setReceivedPage : setSentPage;
  const isSeller = tab === "received";

  // ── Group offers by status ──────────────────────────────────────────────
  const STATUS_SECTIONS: {
    key: string;
    label: string;
    icon: React.ReactNode;
    statuses: string[];
    emptyLabel: string;
  }[] = [
    {
      key: "pending",
      label: "Pending",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      statuses: ["pending"],
      emptyLabel: "No pending offers",
    },
    {
      key: "countered",
      label: "Countered",
      icon: <RotateCcw className="w-4 h-4 text-[#6b6560]" />,
      statuses: ["countered"],
      emptyLabel: "No countered offers",
    },
    {
      key: "accepted",
      label: "Accepted",
      icon: <Check className="w-4 h-4 text-green-500" />,
      statuses: ["accepted"],
      emptyLabel: "No accepted offers",
    },
    {
      key: "closed",
      label: "Declined & Expired",
      icon: <X className="w-4 h-4 text-[#8a8280]" />,
      statuses: ["declined", "withdrawn", "expired"],
      emptyLabel: "No declined or expired offers",
    },
  ];

  const grouped = STATUS_SECTIONS.map((section) => ({
    ...section,
    offers: offers.filter((o) => section.statuses.includes(o.status)),
  }));

  // Count badges
  const pendingReceivedCount = received.filter(
    (o) => o.status === "pending",
  ).length;
  const pendingSentCount = sent.filter(
    (o) => o.status === "pending" || o.status === "countered",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Offers</h1>
        <p className="text-sm text-[#6b6560] mt-0.5">
          Manage offers you've received and sent.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f0eeeb] p-1 w-fit">
        <button
          disabled={pageLoading}
          type="button"
          onClick={() => setTab("received")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "received"
              ? "bg-white text-[#1a1a1a] shadow-sm"
              : "text-[#6b6560] hover:text-[#666]"
          }`}
        >
          Received
          {pendingReceivedCount > 0 && (
            <span className="bg-[#2C2826] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingReceivedCount}
            </span>
          )}
        </button>
        <button
          disabled={pageLoading}
          type="button"
          onClick={() => setTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "sent"
              ? "bg-white text-[#1a1a1a] shadow-sm"
              : "text-[#6b6560] hover:text-[#666]"
          }`}
        >
          Sent
          {pendingSentCount > 0 && (
            <span className="bg-[#bbb] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingSentCount}
            </span>
          )}
        </button>
      </div>

      {pageLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-[#6b6560] animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white border border-[#e8e6e3] p-16 text-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isSeller ? "bg-[#faf9f7]" : "bg-[#faf9f7]"}`}
          >
            <Tag
              className={`w-7 h-7 ${isSeller ? "text-[#8a8280]" : "text-[#8a8280]"}`}
            />
          </div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">
            {isSeller ? "No offers yet" : "No offers sent"}
          </h3>
          <p className="text-[#6b6560] text-sm mb-6">
            {isSeller
              ? "When buyers make offers on your listings, they'll appear here."
              : "Browse listings and make an offer when you find something you like."}
          </p>
          {!isSeller && (
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2C2826] text-white text-sm font-medium hover:bg-[#3D3633] transition-colors"
            >
              Browse Listings
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(
            (section) =>
              section.offers.length > 0 && (
                <div key={section.key}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    {section.icon}
                    <h2 className="text-sm font-semibold text-[#666]">
                      {section.label}
                    </h2>
                    <span className="text-xs text-[#8a8280] bg-[#f0eeeb] px-2 py-0.5 rounded-full">
                      {section.offers.length}
                    </span>
                  </div>

                  {/* Offer cards */}
                  <div className="space-y-3">
                    {section.offers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        isSeller={isSeller}
                        userId={userId}
                        focused={offer.id === focusOfferId}
                        onUpdateAction={(id, patch) =>
                          isSeller
                            ? setReceived((prev) =>
                                updateOffer(prev, id, patch),
                              )
                            : setSent((prev) => updateOffer(prev, id, patch))
                        }
                        onDeleteAction={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ),
          )}

          <Pagination page={page} total={total} onPageAction={setPage} />
        </div>
      )}
    </div>
  );
}
