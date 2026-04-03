"use client";

import {
  Check,
  CreditCard,
  Crown,
  Gift,
  Loader2,
  Ticket,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { PRO_SELLER_FEATURES } from "./pro-seller-features";

type Props = {
  dealerPrice: string;
  dealerInterval: string;
  subscribing: boolean;
  onSubscribeAction: () => void;
  onCloseAction: () => void;
  /** Optional headline override — defaults to "Become a Pro Seller" */
  heading?: string;
  /** Optional subheading override */
  subheading?: string;
};

export default function ProSellerModal({
  dealerPrice,
  dealerInterval,
  subscribing,
  onSubscribeAction,
  onCloseAction,
  heading = "Become a Pro Seller",
  subheading = "Everything you need to grow your business on NextBazar.",
}: Props) {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);

  async function handleRedeem() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");

    try {
      const res = await fetch("/api/dealer/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.error || "Something went wrong");
        setPromoLoading(false);
        return;
      }

      setPromoSuccess(true);
      setPromoLoading(false);

      // Redirect to shop setup after a brief moment
      setTimeout(() => {
        router.push("/shop-onboarding");
        router.refresh();
      }, 1500);
    } catch {
      setPromoError("Network error — please try again");
      setPromoLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCloseAction}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#2C2826] p-8 text-white text-center shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Pro Seller Subscription"
      >
        {/* Close button */}
        <button
          onClick={onCloseAction}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#8E7A6B] flex items-center justify-center mx-auto mb-5">
            <Crown className="w-8 h-8" />
          </div>
          <h2
            className="text-2xl font-light mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {heading}
          </h2>
          <p className="text-white/50 text-sm mb-1 max-w-sm mx-auto">
            {subheading}
          </p>
          <div className="my-5">
            <span
              className="text-3xl font-light"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {dealerPrice}
            </span>
            <span className="text-lg font-medium text-white/40">
              /{dealerInterval}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left mb-6 max-w-md mx-auto">
            {PRO_SELLER_FEATURES.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 text-sm text-white/80"
              >
                <div className="w-5 h-5 bg-[#8E7A6B]/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#8E7A6B]" />
                </div>
                {f}
              </div>
            ))}
          </div>

          {/* ── Promo code section ─────────────────────────────────────── */}
          {promoSuccess ? (
            <div className="bg-emerald-500/20 border border-emerald-400/30 px-5 py-4 inline-flex items-center gap-2.5 text-emerald-200 font-medium">
              <Gift className="w-5 h-5" />
              Pro Seller activated — setting up your shop...
            </div>
          ) : (
            <>
              {/* Promo code input — always visible, no card needed */}
              <div className="bg-white/5 border border-white/10 px-4 py-4 max-w-sm mx-auto">
                <p className="text-white/50 text-[10px] font-medium tracking-[0.15em] uppercase mb-2.5 flex items-center justify-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" />
                  Have a promo code? Get started free
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                    placeholder="Enter promo code"
                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus-visible:border-[#8E7A6B] font-mono tracking-wider"
                    disabled={promoLoading}
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={promoLoading || !promoCode.trim()}
                    className="bg-[#8E7A6B] hover:bg-[#7A6657] text-white font-medium px-4 py-2.5 text-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                  >
                    {promoLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Gift className="w-3.5 h-3.5" />
                    )}
                    Redeem
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-300 text-xs mt-2 text-left">
                    {promoError}
                  </p>
                )}
                <p className="text-white/30 text-[10px] mt-2">
                  No credit card required
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4 max-w-sm mx-auto">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-white/30 text-xs font-medium">or</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              {/* Subscribe with card */}
              <button
                onClick={onSubscribeAction}
                disabled={subscribing}
                className="bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-white/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {subscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Subscribe with Card
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
