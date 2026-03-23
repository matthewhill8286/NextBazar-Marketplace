"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
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
import LeaveReviewModal from "@/app/components/leave-review-modal";
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
  buyer?: { id: string; display_name: string; avatar_url: string | null } | null;
  seller?: { id: string; display_name: string; avatar_url: string | null } | null;
};

type Props = {
  userId: string;
  focusOfferId?: string;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: "Pending",   bg: "bg-amber-50",  text: "text-amber-700" },
  accepted:  { label: "Accepted",  bg: "bg-green-50",  text: "text-green-700" },
  declined:  { label: "Declined",  bg: "bg-red-50",    text: "text-red-600"   },
  countered: { label: "Countered", bg: "bg-indigo-50",   text: "text-indigo-700"  },
  withdrawn: { label: "Withdrawn", bg: "bg-gray-100",  text: "text-gray-500"  },
  expired:   { label: "Expired",   bg: "bg-gray-100",  text: "text-gray-500"  },
};

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
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
          className={`w-3.5 h-3.5 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}

function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-gray-400">
        Page {page + 1} of {totalPages} · {total} offer{total !== 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-1">
        <button
            type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPage(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
              i === page
                ? "bg-indigo-600 text-white"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
            type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
  onUpdate,
  onDelete,
  focused = false,
}: {
  offer: Offer;
  isSeller: boolean;
  userId: string;
  onUpdate: (id: string, patch: Partial<Offer>) => void;
  onDelete: (id: string) => void;
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
  const cardRef = useRef<HTMLDivElement>(null);

  const listing = offer.listings;
  const person = isSeller ? offer.buyer : offer.seller;
  const isTerminal = TERMINAL_STATUSES.includes(offer.status);

  useEffect(() => {
    if (focused && cardRef.current) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
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
        return;
      }
      onUpdate(offer.id, { status, responded_at: new Date().toISOString(), ...extras } as Partial<Offer>);
      setShowCounter(false);
      router.refresh();
    } catch {
      setActionError("Couldn't update offer. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    setLoading("delete");
    setActionError(null);
    try {
      const { error } = await supabase.from("offers").delete().eq("id", offer.id);
      if (error) {
        setActionError("Couldn't delete offer. Please try again.");
        setDeleteConfirm(false);
        return;
      }
      onDelete(offer.id);
    } catch {
      setActionError("Couldn't delete offer. Please try again.");
      setDeleteConfirm(false);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`bg-white rounded-xl border overflow-hidden transition-colors ${
          focused ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-100"
        }`}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: this can be looked another time */}
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Listing thumbnail */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
            {listing?.primary_image_url ? (
              <Image
                src={listing.primary_image_url}
                alt={listing.title || ""}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={listing ? `/listing/${listing.slug}` : "#"}
              className="font-medium text-gray-900 hover:text-indigo-600 transition-colors text-sm truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {listing?.title || "Listing"}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
              {person && (
                <span className="flex items-center gap-1">
                  <Avatar name={person.display_name} avatarUrl={person.avatar_url} />
                  {isSeller ? "from" : "to"} {person.display_name}
                </span>
              )}
              <span>·</span>
              <span className="font-semibold text-gray-900 text-sm">
                {sym}{offer.amount.toLocaleString()}
              </span>
              {listing?.price && (
                <span className="text-gray-400">
                  (asking {sym}{listing.price.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
            {offer.status === "pending" && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {timeLeft(offer.expires_at)}
              </span>
            )}
            {offer.status === "accepted" && hasReviewed && existingRating && (
              <StarRating rating={existingRating} />
            )}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-3">
            {offer.message && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1 font-medium">
                  <MessageCircle className="w-3 h-3 inline mr-1" />
                  Buyer&apos;s message
                </p>
                <p className="text-sm text-gray-700">{offer.message}</p>
              </div>
            )}

            {offer.counter_amount && (
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xs text-indigo-600 mb-1 font-medium">
                  Counter offer: {sym}{offer.counter_amount.toLocaleString()}
                </p>
                {offer.counter_message && (
                  <p className="text-sm text-indigo-700">{offer.counter_message}</p>
                )}
              </div>
            )}

            {/* Review prompt for accepted offers */}
            {offer.status === "accepted" && person && (
              <div className={`rounded-xl p-3 flex items-center justify-between gap-3 ${
                hasReviewed ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"
              }`}>
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${hasReviewed ? "text-amber-500 fill-amber-500" : "text-green-600"}`} />
                  <div>
                    <p className={`text-xs font-medium ${hasReviewed ? "text-amber-800" : "text-green-800"}`}>
                      {hasReviewed ? "You reviewed this transaction" : "How was it?"}
                    </p>
                    <p className={`text-xs ${hasReviewed ? "text-amber-600" : "text-green-600"}`}>
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
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5"
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
                      onClick={() => respond("accepted")}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading === "accepted" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                        type="button"
                      onClick={() => setShowCounter(true)}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Counter
                    </button>
                    <button
                        type="button"
                      onClick={() => respond("declined")}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {loading === "declined" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Decline
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-gray-600">
                      Your counter offer amount
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{sym}</span>
                      <input
                        type="number"
                        min="1"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Amount"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder="Optional message"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                          type="button"
                        onClick={() => respond("countered", {
                          counter_amount: Number(counterAmount),
                          counter_message: counterMessage || null,
                        })}
                        disabled={!counterAmount || !!loading}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {loading === "countered" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Counter"}
                      </button>
                      <button
                          type="button"
                        onClick={() => setShowCounter(false)}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Buyer actions */}
            {!isSeller && (offer.status === "pending" || offer.status === "countered") && (
              <button
                  type="button"
                onClick={() => respond("withdrawn")}
                disabled={!!loading}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {loading === "withdrawn" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Withdraw offer
              </button>
            )}

            {!isSeller && offer.status === "countered" && offer.counter_amount != null && (
              <div className="flex gap-2">
                <button
                    type="button"
                  onClick={() => respond("accepted")}
                  disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "accepted" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Accept {sym}{offer.counter_amount.toLocaleString()}
                </button>
                <button
                    type="button"
                  onClick={() => respond("declined")}
                  disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "declined" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Decline
                </button>
              </div>
            )}

            {/* Delete button — only for terminal offers */}
            {isTerminal && (
              <div className="pt-1 border-t border-gray-50">
                {deleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex-1">Remove this offer permanently?</span>
                    <button
                        type="button"
                      onClick={handleDelete}
                      disabled={loading === "delete"}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {loading === "delete" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Delete
                    </button>
                    <button
                        type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                      type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove from history
                  </button>
                )}
              </div>
            )}

            {/* Error message */}
            {actionError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
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
          onReviewedAction={() => setHasReviewed(true)}
        />
      )}
    </>
  );
}

// ─── Public card exports ──────────────────────────────────────────────────────
// Thin wrappers that fix the `isSeller` flag so callers (and tests) don't have
// to know about the internal prop.  Both receive the same public props.

type OfferCardPublicProps = {
  offer: Offer;
  userId: string;
  onUpdate: (id: string, patch: Partial<Offer>) => void;
  onDelete: (id: string) => void;
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

export default function OffersClient({ userId, focusOfferId }: Props) {
  const supabase = createClient();

  const defaultTab: "received" | "sent" = "received";
  const [tab, setTab] = useState<"received" | "sent">(defaultTab);
  const [receivedPage, setReceivedPage] = useState(0);
  const [sentPage, setSentPage]         = useState(0);
  const [received, setReceived]         = useState<Offer[]>([]);
  const [sent, setSent]                 = useState<Offer[]>([]);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentTotal, setSentTotal]         = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  const RECEIVED_SELECT = `*, listings(id,title,slug,primary_image_url,price,currency), buyer:profiles!offers_buyer_id_fkey(id,display_name,avatar_url)`;
  const SENT_SELECT     = `*, listings(id,title,slug,primary_image_url,price,currency), seller:profiles!offers_seller_id_fkey(id,display_name,avatar_url)`;

  const fetchPage = useCallback(
    async (which: "received" | "sent", page: number) => {
      setPageLoading(true);
      const from = page * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

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
  useEffect(() => { fetchPage("received", receivedPage); }, [fetchPage, receivedPage]);
  useEffect(() => { fetchPage("sent",     sentPage);     }, [fetchPage, sentPage]);

  // ── Realtime offer updates ──────────────────────────────────────────────
  // Without this, the buyer's "Sent" tab stays stale after the seller counters
  // (or vice-versa) because router.refresh() doesn't re-run fetchPage effects.
  // We subscribe to postgres_changes for both sides of the current user so
  // any status / amount change is reflected immediately without a page reload.
  useEffect(() => {
    const channel = supabase
      .channel(`offers-realtime-${userId}`)
      // Offers where this user is the BUYER (visible in "Sent" tab)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "offers", filter: `buyer_id=eq.${userId}` },
        (payload) => {
          const patch = payload.new as Partial<Offer> & { id: string };
          setSent((prev) => prev.map((o) => (o.id === patch.id ? { ...o, ...patch } : o)));
        },
      )
      // Offers where this user is the SELLER (visible in "Received" tab)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "offers", filter: `seller_id=eq.${userId}` },
        (payload) => {
          const patch = payload.new as Partial<Offer> & { id: string };
          setReceived((prev) => prev.map((o) => (o.id === patch.id ? { ...o, ...patch } : o)));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  // If there's a focused offer and it's in the sent list, switch to that tab
  useEffect(() => {
    if (!focusOfferId) return;
    if (sent.some((o) => o.id === focusOfferId)) setTab("sent");
  }, [focusOfferId, sent]);

  function updateOffer(list: Offer[], id: string, patch: Partial<Offer>): Offer[] {
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

  const pendingReceivedCount = receivedTotal > 0
    ? received.filter((o) => o.status === "pending").length
    : 0;

  const offers       = tab === "received" ? received : sent;
  const total        = tab === "received" ? receivedTotal : sentTotal;
  const page         = tab === "received" ? receivedPage : sentPage;
  const setPage      = tab === "received" ? setReceivedPage : setSentPage;
  const isSeller     = tab === "received";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage offers you've received and sent.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
            disabled={pageLoading}
            type="button"
          onClick={() => setTab("received")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "received" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Received
          {pendingReceivedCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingReceivedCount}
            </span>
          )}
        </button>
        <button
            disabled={pageLoading}
            type="button"
          onClick={() => setTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "sent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent
          {sent.filter((o) => o.status === "pending").length > 0 && (
            <span className="bg-gray-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {sent.filter((o) => o.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {pageLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isSeller ? "bg-indigo-50" : "bg-gray-50"}`}>
            <Tag className={`w-7 h-7 ${isSeller ? "text-indigo-400" : "text-gray-400"}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {isSeller ? "No offers yet" : "No offers sent"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {isSeller
              ? "When buyers make offers on your listings, they'll appear here."
              : "Browse listings and make an offer when you find something you like."}
          </p>
          {!isSeller && (
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse Listings
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isSeller={isSeller}
              userId={userId}
              focused={offer.id === focusOfferId}
              onUpdate={(id, patch) =>
                isSeller
                  ? setReceived((prev) => updateOffer(prev, id, patch))
                  : setSent((prev) => updateOffer(prev, id, patch))
              }
              onDelete={handleDelete}
            />
          ))}

          <Pagination page={page} total={total} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
