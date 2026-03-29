"use client";

import { AlertCircle, CheckCircle, Euro, Loader2, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  listingId: string;
  sellerId: string;
  listingTitle: string;
  listingPrice: number | null;
  currency: string;
  onCloseAction: () => void;
  onOfferSentAction?: (
    offerId: string,
    amount: number,
    currency: string,
  ) => void;
};

export default function MakeOfferModal({
  listingId,
  sellerId,
  listingTitle,
  listingPrice,
  currency,
  onCloseAction,
  onOfferSentAction,
}: Props) {
  const supabase = createClient();
  const sym = currency === "EUR" ? "€" : currency;

  const [amount, setAmount] = useState(
    listingPrice ? String(Math.round(listingPrice * 0.9)) : "",
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      setErrorMsg("Please enter a valid offer amount.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErrorMsg("You must be logged in to make an offer.");
      setLoading(false);
      return;
    }

    const { data: newOffer, error } = await supabase
      .from("offers")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        amount: val,
        currency,
        message: message.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      setErrorMsg(
        error.message.includes("duplicate")
          ? "You already have a pending offer on this listing."
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
      return;
    }

    setState("success");
    setLoading(false);
    onOfferSentAction?.(newOffer?.id ?? "", Number(amount), currency);
  }

  const pct = listingPrice
    ? Math.round(((Number(amount) - listingPrice) / listingPrice) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <h2 className="text-lg font-bold text-[#1a1a1a]">Make an Offer</h2>
          <button
            onClick={onCloseAction}
            className="p-2 rounded-full hover:bg-[#f0eeeb] transition-colors text-[#bbb]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {state === "success" ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">
              Offer Sent!
            </h3>
            <p className="text-[#999] text-sm mb-6">
              Your offer of{" "}
              <span className="font-semibold text-[#1a1a1a]">
                {sym}
                {Number(amount).toLocaleString()}
              </span>{" "}
              has been sent to the seller. You'll receive a notification when
              they respond.
            </p>
            <button
              onClick={onCloseAction}
              className="px-6 py-2.5 bg-[#2C2826] text-white text-sm font-medium hover:bg-[#3D3633] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Listing context */}
            <div className="bg-[#faf9f7] p-3">
              <p className="text-xs text-[#999] mb-0.5">Listing</p>
              <p className="font-medium text-[#1a1a1a] text-sm line-clamp-1">
                {listingTitle}
              </p>
              {listingPrice && (
                <p className="text-sm text-[#999] mt-0.5">
                  Asking price:{" "}
                  <span className="font-semibold text-[#1a1a1a]">
                    {sym}
                    {listingPrice.toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Your Offer Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] font-medium">
                  {sym}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus:border-indigo-400 focus:ring-2 focus:ring-[#8E7A6B]/10 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
              {listingPrice && amount && Number(amount) > 0 && (
                <p
                  className={`text-xs mt-1.5 ${
                    pct! < 0
                      ? "text-amber-600"
                      : pct! === 0
                        ? "text-[#bbb]"
                        : "text-green-600"
                  }`}
                >
                  {pct! < 0
                    ? `${Math.abs(pct!)}% below asking price`
                    : pct! === 0
                      ? "Matches asking price"
                      : `${pct}% above asking price`}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1.5">
                Message{" "}
                <span className="font-normal text-[#bbb]">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder="Why you're interested, pickup availability, etc."
                className="w-full px-4 py-3 border border-[#e8e6e3] focus:border-indigo-400 focus:ring-2 focus:ring-[#8E7A6B]/10 outline-none text-sm resize-none"
              />
              <p className="text-xs text-[#bbb] text-right mt-1">
                {message.length}/500
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onCloseAction}
                className="flex-1 py-3 border border-[#e8e6e3] text-sm font-medium text-[#666] hover:bg-[#faf9f7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-indigo-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Euro className="w-4 h-4" />
                    Send Offer
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-[#bbb] text-center">
              Offers expire after 48 hours if not responded to.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
