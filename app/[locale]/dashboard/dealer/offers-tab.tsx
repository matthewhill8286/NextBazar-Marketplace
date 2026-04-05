"use client";

import {
  ArrowLeftRight,
  Check,
  Clock,
  Euro,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { OfferRow } from "./types";
import { OFFER_STATUS_BADGE } from "./types";

type OfferFilter =
  | "all"
  | "pending"
  | "accepted"
  | "declined"
  | "countered"
  | "expired";

export default function OffersTab({
  shopMode = false,
}: {
  shopMode?: boolean;
}) {
  const { userId } = useAuth();
  const supabase = createClient();

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OfferFilter>("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<{
    offerId: string;
    amount: string;
    message: string;
  } | null>(null);

  // ─── Load offers ───────────────────────────────────────────────────────
  const loadOffers = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("offers")
      .select(
        `*, listing:listings(id, title, slug, price, primary_image_url), buyer:profiles!offers_buyer_id_fkey(id, display_name, avatar_url)`,
      )
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (data) setOffers(data as unknown as OfferRow[]);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // ─── Filtered offers ──────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      filter === "all" ? offers : offers.filter((o) => o.status === filter),
    [offers, filter],
  );

  const pendingCount = offers.filter((o) => o.status === "pending").length;

  // ─── Actions ──────────────────────────────────────────────────────────
  async function handleAccept(offerId: string) {
    setActionLoadingId(offerId);
    await supabase
      .from("offers")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", offerId);
    await loadOffers();
    setActionLoadingId(null);
  }

  async function handleReject(offerId: string) {
    setActionLoadingId(offerId);
    await supabase
      .from("offers")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", offerId);
    await loadOffers();
    setActionLoadingId(null);
  }

  async function handleCounter(offerId: string) {
    if (!counterOffer || counterOffer.offerId !== offerId) return;
    const amount = parseFloat(counterOffer.amount);
    if (isNaN(amount) || amount <= 0) return;

    setActionLoadingId(offerId);
    await supabase
      .from("offers")
      .update({
        status: "countered",
        counter_amount: amount,
        counter_message: counterOffer.message || null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", offerId);
    setCounterOffer(null);
    await loadOffers();
    setActionLoadingId(null);
  }

  // ─── Stats ────────────────────────────────────────────────────────────
  const totalOfferValue = offers
    .filter((o) => o.status === "pending")
    .reduce((s, o) => s + o.amount, 0);
  const acceptedValue = offers
    .filter((o) => o.status === "accepted")
    .reduce((s, o) => s + o.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#8a8280]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-amber-50 flex items-center justify-center mb-3">
            <Clock className="w-[18px] h-[18px] text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            {pendingCount}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">Pending Offers</div>
        </div>
        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-emerald-50 flex items-center justify-center mb-3">
            <Euro className="w-[18px] h-[18px] text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            &euro;{totalOfferValue.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">Pending Offer Value</div>
        </div>
        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-emerald-50 flex items-center justify-center mb-3">
            <Check className="w-[18px] h-[18px] text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            &euro;{acceptedValue.toLocaleString()}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">Accepted Value</div>
        </div>
        <div className="bg-white border border-[#e8e6e3] p-5">
          <div className="w-9 h-9 bg-[#f0eeeb] flex items-center justify-center mb-3">
            <MessageCircle className="w-[18px] h-[18px] text-[#8E7A6B]" />
          </div>
          <div className="text-2xl font-bold text-[#1a1a1a]">
            {offers.length}
          </div>
          <div className="text-xs text-[#6b6560] mt-1">Total Offers</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {(
          [
            { key: "all", label: "All" },
            { key: "pending", label: `Pending (${pendingCount})` },
            { key: "accepted", label: "Accepted" },
            { key: "countered", label: "Countered" },
            { key: "declined", label: "Declined" },
            { key: "expired", label: "Expired" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-[#1a1a1a] text-white"
                : "bg-[#f0eeeb] text-[#6b6560] hover:text-[#1a1a1a]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Offers list */}
      <div className="space-y-3">
        {filtered.map((offer) => (
          <div
            key={offer.id}
            className="bg-white border border-[#e8e6e3] p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Listing thumbnail */}
              <div className="w-14 h-14 bg-[#f0eeeb] overflow-hidden shrink-0 relative">
                {offer.listing?.primary_image_url && (
                  <Image
                    src={offer.listing.primary_image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                )}
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/listing/${offer.listing?.slug ?? ""}`}
                      className="text-sm font-semibold text-[#1a1a1a] hover:text-[#8E7A6B] transition-colors"
                    >
                      {offer.listing?.title ?? "Unknown listing"}
                    </Link>
                    <p className="text-xs text-[#6b6560] mt-0.5">
                      From{" "}
                      <span className="font-medium text-[#1a1a1a]">
                        {offer.buyer?.display_name ?? "Anonymous"}
                      </span>
                      {" \u00B7 "}
                      {new Date(offer.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 capitalize shrink-0 ${OFFER_STATUS_BADGE[offer.status] ?? "bg-[#f0eeeb] text-[#6b6560]"}`}
                  >
                    {offer.status}
                  </span>
                </div>

                {/* Offer amounts */}
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <span className="text-xs text-[#6b6560]">
                      Listed price:
                    </span>
                    <span className="ml-1 text-sm font-medium text-[#1a1a1a]">
                      &euro;{offer.listing?.price?.toLocaleString() ?? "\u2014"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#6b6560]">Offer:</span>
                    <span className="ml-1 text-sm font-bold text-[#8E7A6B]">
                      &euro;{offer.amount.toLocaleString()}
                    </span>
                  </div>
                  {offer.counter_amount && (
                    <div>
                      <span className="text-xs text-[#6b6560]">Counter:</span>
                      <span className="ml-1 text-sm font-bold text-blue-600">
                        &euro;{offer.counter_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {offer.message && (
                  <p className="text-xs text-[#6b6560] mt-2 bg-[#faf9f7] p-2 italic">
                    &ldquo;{offer.message}&rdquo;
                  </p>
                )}

                {/* Expiry notice */}
                {offer.status === "pending" && (
                  <p className="text-[10px] text-amber-600 mt-1.5">
                    Expires{" "}
                    {new Date(offer.expires_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {/* Action buttons for pending offers */}
                {offer.status === "pending" && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleAccept(offer.id)}
                      disabled={actionLoadingId === offer.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === offer.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        setCounterOffer({
                          offerId: offer.id,
                          amount: "",
                          message: "",
                        })
                      }
                      disabled={actionLoadingId === offer.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      Counter
                    </button>
                    <button
                      onClick={() => handleReject(offer.id)}
                      disabled={actionLoadingId === offer.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      Decline
                    </button>
                  </div>
                )}

                {/* Counter-offer form */}
                {counterOffer?.offerId === offer.id && (
                  <div className="mt-3 p-3 bg-[#faf9f7] border border-[#e8e6e3] space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-[#6b6560] uppercase tracking-wider">
                          Counter Amount (&euro;)
                        </label>
                        <input
                          type="number"
                          value={counterOffer.amount}
                          onChange={(e) =>
                            setCounterOffer((prev) =>
                              prev ? { ...prev, amount: e.target.value } : null,
                            )
                          }
                          placeholder={String(offer.listing?.price ?? "")}
                          className="mt-1 w-full px-3 py-2 text-sm border border-[#e8e6e3] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E7A6B]/20 focus:border-[#8E7A6B]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-medium text-[#6b6560] uppercase tracking-wider">
                          Message (optional)
                        </label>
                        <input
                          type="text"
                          value={counterOffer.message}
                          onChange={(e) =>
                            setCounterOffer((prev) =>
                              prev
                                ? { ...prev, message: e.target.value }
                                : null,
                            )
                          }
                          placeholder="e.g. I can do this price if picked up today"
                          className="mt-1 w-full px-3 py-2 text-sm border border-[#e8e6e3] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E7A6B]/20 focus:border-[#8E7A6B]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCounter(offer.id)}
                        disabled={actionLoadingId === offer.id}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Send Counter
                      </button>
                      <button
                        onClick={() => setCounterOffer(null)}
                        className="px-3 py-1.5 text-xs text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white border border-[#e8e6e3] p-12 text-center">
            <Euro className="w-8 h-8 mx-auto mb-2 text-[#8a8280]" />
            <p className="font-medium text-[#1a1a1a]">No offers found</p>
            <p className="text-xs text-[#6b6560] mt-1">
              {filter === "all"
                ? "Offers from buyers will appear here"
                : `No ${filter} offers`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
