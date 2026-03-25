"use client";

import { Check, CreditCard, Crown, Loader2, X } from "lucide-react";
import { PRO_SELLER_FEATURES } from "./pro-seller-features";

type Props = {
  dealerPrice: string;
  dealerInterval: string;
  subscribing: boolean;
  onSubscribe: () => void;
  onClose: () => void;
  /** Optional headline override — defaults to "Become a Pro Seller" */
  heading?: string;
  /** Optional subheading override */
  subheading?: string;
};

export default function ProSellerModal({
  dealerPrice,
  dealerInterval,
  subscribing,
  onSubscribe,
  onClose,
  heading = "Become a Pro Seller",
  subheading = "Everything you need to grow your business on NextBazar.",
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-linear-to-br from-purple-600 via-indigo-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Decorative bg */}
        <div className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Crown className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{heading}</h2>
          <p className="text-white/75 text-sm mb-1 max-w-sm mx-auto">
            {subheading}
          </p>
          <div className="text-3xl font-extrabold my-5">
            {dealerPrice}
            <span className="text-lg font-medium text-white/50">
              /{dealerInterval}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left mb-6 max-w-md mx-auto">
            {PRO_SELLER_FEATURES.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 text-sm text-white/90"
              >
                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-300" />
                </div>
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={onSubscribe}
            disabled={subscribing}
            className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-black/10 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {subscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}
