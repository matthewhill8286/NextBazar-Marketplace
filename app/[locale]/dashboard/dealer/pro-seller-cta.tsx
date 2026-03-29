"use client";

import { Check, CreditCard, Crown, Loader2 } from "lucide-react";
import { PRO_SELLER_FEATURES } from "./pro-seller-features";

type Props = {
  dealerPrice: string;
  dealerInterval: string;
  subscribing: boolean;
  onSubscribe: () => void;
};

export default function ProSellerCTA({
  dealerPrice,
  dealerInterval,
  subscribing,
  onSubscribe,
}: Props) {
  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="relative overflow-hidden bg-[#2C2826] p-8 md:p-12 text-white text-center">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#8E7A6B] flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8" />
          </div>
          <h1
            className="text-3xl font-light mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Become a Pro Seller
          </h1>
          <p className="text-white/50 text-lg mb-2 max-w-md mx-auto">
            Everything you need to grow your business on NextBazar.
          </p>
          <div className="my-6">
            <span
              className="text-4xl font-light"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {dealerPrice}
            </span>
            <span className="text-lg font-medium text-white/40">
              /{dealerInterval}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-lg mx-auto">
            {PRO_SELLER_FEATURES.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2.5 text-sm text-white/80"
              >
                <div className="w-5 h-5 bg-[#8E7A6B]/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#8E7A6B]" />
                </div>
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={onSubscribe}
            disabled={subscribing}
            className="bg-white text-[#1a1a1a] text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-white/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
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
