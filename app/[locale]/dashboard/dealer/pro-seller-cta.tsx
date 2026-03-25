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
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white text-center">
        {/* Decorative bg */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Become a Pro Seller</h1>
          <p className="text-white/75 text-lg mb-2 max-w-md mx-auto">
            Everything you need to grow your business on NextBazar.
          </p>
          <div className="text-4xl font-extrabold my-6">
            {dealerPrice}
            <span className="text-lg font-medium text-white/50">
              /{dealerInterval}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-lg mx-auto">
            {PRO_SELLER_FEATURES.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2.5 text-sm text-white/90"
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
