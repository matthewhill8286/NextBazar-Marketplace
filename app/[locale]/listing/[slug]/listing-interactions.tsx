"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import MakeOfferModal from "@/app/components/make-offer-modal";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { ListingDetailRow } from "@/lib/supabase/supabase.types";
import { ContactButtons } from "./listing-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  listing: ListingDetailRow;
  accentColor: string | null;
  shopSlug: string | null;
};

type ExistingOffer = {
  id: string;
  status: string;
  amount: number | null;
  counter_amount: number | null;
  currency: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListingInteractions({ listing, accentColor }: Props) {
  const t = useTranslations("listing");
  const { userId: authUserId } = useAuth();
  const supabase = createClient();

  const [currentStatus, setCurrentStatus] = useState(listing.status);
  const [existingOffer, setExistingOffer] = useState<ExistingOffer | null>(
    null,
  );
  const [offerCount, setOfferCount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const viewCounted = useRef(false);

  const profile = listing.profiles;
  const isOwner = !!authUserId && authUserId === listing.user_id;

  // ── Bootstrap: view count + offer history + analytics ──────────────────────
  useEffect(() => {
    // Track recently viewed
    try {
      const stored = localStorage.getItem("recentlyViewed");
      const prev: string[] = stored ? JSON.parse(stored) : [];
      const updated = [
        listing.id,
        ...prev.filter((id: string) => id !== listing.id),
      ].slice(0, 12);
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    } catch {}

    // Increment view count atomically — once per page visit
    if (!viewCounted.current) {
      viewCounted.current = true;
      supabase.rpc("increment_view_count", { p_listing_id: listing.id }).then();
    }

    // Fetch offer history and analytics (non-blocking)
    if (authUserId && authUserId !== listing.user_id) {
      supabase
        .from("offers")
        .select("id, status, amount, counter_amount, currency")
        .eq("listing_id", listing.id)
        .eq("buyer_id", authUserId)
        .then(({ data: allOffers }) => {
          if (!allOffers) return;
          setOfferCount(allOffers.length);
          const active = allOffers.find(
            (o) =>
              o.status === "pending" ||
              o.status === "countered" ||
              o.status === "accepted",
          );
          if (active) {
            setExistingOffer({
              id: active.id,
              status: active.status,
              amount: active.amount ?? null,
              counter_amount: active.counter_amount ?? null,
              currency: active.currency ?? "EUR",
            });
          }
        });

      fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id }),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, authUserId]);

  // ── Realtime: listing status ───────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`listing-status-${listing.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `id=eq.${listing.id}`,
        },
        (payload) => {
          const patch = payload.new as { status?: string };
          if (patch.status) setCurrentStatus(patch.status);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing.id, supabase]);

  // ── Realtime: buyer's offer on this listing ────────────────────────────────
  useEffect(() => {
    if (!authUserId || authUserId === listing.user_id) return;

    const channel = supabase
      .channel(`listing-offer-${listing.id}-${authUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
          filter: `buyer_id=eq.${authUserId}`,
        },
        (payload) => {
          const patch = payload.new as {
            id: string;
            listing_id: string;
            status: string;
            amount: number;
            counter_amount: number | null;
            currency: string;
          };
          if (patch.listing_id !== listing.id) return;
          const { status } = patch;
          if (
            status === "pending" ||
            status === "countered" ||
            status === "accepted"
          ) {
            setExistingOffer({
              id: patch.id,
              status,
              amount: patch.amount ?? null,
              counter_amount: patch.counter_amount ?? null,
              currency: patch.currency ?? "EUR",
            });
          } else {
            setExistingOffer(null);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing.id, listing.user_id, authUserId, supabase]);

  // ── Helper ─────────────────────────────────────────────────────────────────
  function fmtPrice(amount: number | null, currency: string): string {
    if (amount == null) return "—";
    const sym = currency === "EUR" ? "€" : currency;
    return `${sym}${amount.toLocaleString()}`;
  }

  return (
    <>
      {/* Contact buttons */}
      <ContactButtons
        listingId={listing.id}
        sellerId={listing.user_id}
        listingTitle={listing.title}
        contactPhone={listing.contact_phone}
        whatsappNumber={profile?.whatsapp_number || null}
        telegramUsername={profile?.telegram_username || null}
        disabled={isOwner}
        accentColor={accentColor}
      />

      {/* Make an Offer / Offer state — non-owners only */}
      {!isOwner && listing.price && currentStatus === "active" && (
        <div className="mt-3">
          {existingOffer ? (
            existingOffer.status === "accepted" ? (
              <div className="w-full rounded-xl overflow-hidden border-2 border-emerald-200">
                <div className="bg-emerald-500 px-4 py-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    Offer accepted!
                  </span>
                </div>
                <div className="bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-emerald-700">
                    <span className="block text-[11px] text-emerald-500 mb-0.5">
                      Accepted amount
                    </span>
                    <span className="font-extrabold text-emerald-800 text-base">
                      {fmtPrice(existingOffer.amount, existingOffer.currency)}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/offers${existingOffer.id ? `?offer=${existingOffer.id}` : ""}`}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ) : existingOffer.status === "countered" ? (
              <Link
                href={`/dashboard/offers${existingOffer.id ? `?offer=${existingOffer.id}` : ""}`}
                className="block w-full rounded-xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-300 transition-all group"
              >
                <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    Counter offer received
                  </span>
                </div>
                <div className="bg-indigo-50 group-hover:bg-indigo-100 transition-colors px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-indigo-600">
                    <span className="block text-[11px] text-indigo-400 mb-0.5">
                      Your offer
                    </span>
                    <span className="font-bold">
                      {fmtPrice(existingOffer.amount, existingOffer.currency)}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-indigo-200" />
                  <div className="text-xs text-indigo-600">
                    <span className="block text-[11px] text-indigo-400 mb-0.5">
                      Counter
                    </span>
                    <span className="font-extrabold text-indigo-700">
                      {fmtPrice(
                        existingOffer.counter_amount,
                        existingOffer.currency,
                      )}
                    </span>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    Respond →
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href={`/dashboard/offers${existingOffer.id ? `?offer=${existingOffer.id}` : ""}`}
                className="block w-full rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-300 transition-all group"
              >
                <div className="bg-amber-500 px-4 py-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-amber-100 shrink-0" />
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    Offer pending
                  </span>
                </div>
                <div className="bg-amber-50 group-hover:bg-amber-100 transition-colors px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-amber-700">
                    <span className="block text-[11px] text-amber-500 mb-0.5">
                      Your offer
                    </span>
                    <span className="font-extrabold text-amber-800 text-base">
                      {fmtPrice(existingOffer.amount, existingOffer.currency)}
                    </span>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                    View →
                  </span>
                </div>
              </Link>
            )
          ) : offerCount >= 2 ? (
            <div className="w-full py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
              <Tag className="w-4 h-4" />
              {t("offerLimitReached")}
            </div>
          ) : (
            <button
              onClick={() => setShowOfferModal(true)}
              className="w-full py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              {t("makeOffer")}
            </button>
          )}
        </div>
      )}

      {/* Sold state — shown instead of CTA when listing is no longer active */}
      {!isOwner && currentStatus === "sold" && (
        <div className="mt-3 w-full py-3 px-4 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed select-none">
          <span className="text-base">🏷️</span>
          This item has been sold
        </div>
      )}

      {/* Make an Offer modal */}
      {showOfferModal && (
        <MakeOfferModal
          listingId={listing.id}
          sellerId={listing.user_id}
          listingTitle={listing.title}
          listingPrice={listing.price}
          currency={listing.currency || "EUR"}
          onCloseAction={() => setShowOfferModal(false)}
          onOfferSentAction={(offerId, amt, cur) => {
            setExistingOffer({
              id: offerId,
              status: "pending",
              amount: amt,
              counter_amount: null,
              currency: cur,
            });
            setOfferCount((c) => c + 1);
            setShowOfferModal(false);
          }}
        />
      )}
    </>
  );
}
