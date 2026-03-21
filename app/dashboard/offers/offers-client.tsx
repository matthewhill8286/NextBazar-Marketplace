"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tag,
  Check,
  X,
  RotateCcw,
  Loader2,
  MessageCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LeaveReviewModal from "@/app/components/leave-review-modal";

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
  receivedOffers: Offer[];
  sentOffers: Offer[];
  focusOfferId?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending:   { label: "Pending",   bg: "bg-amber-50",  text: "text-amber-700" },
  accepted:  { label: "Accepted",  bg: "bg-green-50",  text: "text-green-700" },
  declined:  { label: "Declined",  bg: "bg-red-50",    text: "text-red-600"   },
  countered: { label: "Countered", bg: "bg-blue-50",   text: "text-blue-700"  },
  withdrawn: { label: "Withdrawn", bg: "bg-gray-100",  text: "text-gray-500"  },
  expired:   { label: "Expired",   bg: "bg-gray-100",  text: "text-gray-500"  },
};

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
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

function OfferCard({
  offer,
  isSeller,
  userId,
  onUpdate,
  focused = false,
}: {
  offer: Offer;
  isSeller: boolean;
  userId: string;
  onUpdate: (id: string, patch: Partial<Offer>) => void;
  focused?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const sym = offer.currency === "EUR" ? "€" : offer.currency;
  const cfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
  const [loading, setLoading] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [expanded, setExpanded] = useState(focused);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll focused card into view on mount
  useEffect(() => {
    if (focused && cardRef.current) {
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [focused]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingRating, setExistingRating] = useState<number | null>(null);

  const listing = offer.listings;
  const person = isSeller ? offer.buyer : offer.seller;

  // Check if the current user has already reviewed this offer
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
  }, [offer.id, offer.status, userId]);

  async function respond(status: string, extras: Record<string, unknown> = {}) {
    setLoading(status);
    await supabase
      .from("offers")
      .update({ status, responded_at: new Date().toISOString(), ...extras })
      .eq("id", offer.id);
    onUpdate(offer.id, { status, responded_at: new Date().toISOString(), ...extras } as Partial<Offer>);
    setLoading(null);
    setShowCounter(false);
    // Clear the router cache so navigating back always shows fresh data
    router.refresh();
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`bg-white rounded-xl border overflow-hidden transition-colors ${focused ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100"}`}
      >
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
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-sm truncate block"
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
            {/* Review badge for accepted offers */}
            {offer.status === "accepted" && hasReviewed && existingRating && (
              <div className="flex items-center gap-1">
                <StarRating rating={existingRating} />
              </div>
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
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600 mb-1 font-medium">
                  Counter offer: {sym}{offer.counter_amount.toLocaleString()}
                </p>
                {offer.counter_message && (
                  <p className="text-sm text-blue-700">{offer.counter_message}</p>
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
                      onClick={() => respond("accepted")}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading === "accepted" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                      onClick={() => setShowCounter(true)}
                      disabled={!!loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Counter
                    </button>
                    <button
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
                    <label className="block text-xs font-medium text-gray-600">
                      Your counter offer amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{sym}</span>
                      <input
                        type="number"
                        min="1"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Amount"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder="Optional message"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          respond("countered", {
                            counter_amount: Number(counterAmount),
                            counter_message: counterMessage || null,
                          })
                        }
                        disabled={!counterAmount || !!loading}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading === "countered" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Counter"}
                      </button>
                      <button
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

            {/* Buyer can withdraw the pending offer */}
            {!isSeller && offer.status === "pending" && (
              <button
                onClick={() => respond("withdrawn")}
                disabled={!!loading}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {loading === "withdrawn" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Withdraw offer
              </button>
            )}

            {/* Buyer accepts counter */}
            {!isSeller && offer.status === "countered" && offer.counter_amount && (
              <div className="flex gap-2">
                <button
                  onClick={() => respond("accepted")}
                  disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "accepted" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Accept {sym}{offer.counter_amount.toLocaleString()}
                </button>
                <button
                  onClick={() => respond("declined")}
                  disabled={!!loading}
                  className="flex-1 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === "declined" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Decline
                </button>
              </div>
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

export default function OffersClient({
  userId,
  receivedOffers: initialReceived,
  sentOffers: initialSent,
  focusOfferId,
}: Props) {
  // If the linked offer is in sent, open that tab automatically
  const defaultTab: "received" | "sent" =
    focusOfferId && initialSent.some((o) => o.id === focusOfferId)
      ? "sent"
      : "received";
  const [tab, setTab] = useState<"received" | "sent">(defaultTab);
  const [received, setReceived] = useState(initialReceived);
  const [sent, setSent] = useState(initialSent);

  function updateOffer(list: Offer[], id: string, patch: Partial<Offer>): Offer[] {
    return list.map((o) => (o.id === id ? { ...o, ...patch } : o));
  }

  const pendingReceivedCount = received.filter((o) => o.status === "pending").length;

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
          onClick={() => setTab("received")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "received" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Received
          {pendingReceivedCount > 0 && (
            <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {pendingReceivedCount}
            </span>
          )}
        </button>
        <button
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

      {tab === "received" ? (
        received.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No offers yet</h3>
            <p className="text-gray-500 text-sm">
              When buyers make offers on your listings, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {received.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                isSeller={true}
                userId={userId}
                focused={offer.id === focusOfferId}
                onUpdate={(id, patch) => setReceived((prev) => updateOffer(prev, id, patch))}
              />
            ))}
          </div>
        )
      ) : sent.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No offers sent</h3>
          <p className="text-gray-500 text-sm mb-6">
            Browse listings and make an offer when you find something you like.
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
          {sent.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isSeller={false}
              userId={userId}
              focused={offer.id === focusOfferId}
              onUpdate={(id, patch) => setSent((prev) => updateOffer(prev, id, patch))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
