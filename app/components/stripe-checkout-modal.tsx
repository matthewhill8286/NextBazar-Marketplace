"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Bitcoin, CreditCard, ExternalLink, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { ClientPricing } from "@/lib/stripe";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Props = {
  listingId: string;
  promotionType: "featured" | "urgent";
  pricing?: ClientPricing;
  /** Called when the user closes the modal without paying */
  onCloseAction: () => void;
};

const COINS = [
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A" },
  { symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { symbol: "USDC", name: "USD Coin", color: "#2775CA" },
  { symbol: "SOL", name: "Solana", color: "#9945FF" },
  { symbol: "LTC", name: "Litecoin", color: "#BFBBBB" },
  { symbol: "DOGE", name: "Dogecoin", color: "#C2A633" },
];

function CryptoTab({
  listingId,
  promotionType,
}: {
  listingId: string;
  promotionType: "featured" | "urgent";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCryptoPay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          promotionType,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.hosted_url) {
        throw new Error(data.error || "Failed to create crypto payment");
      }
      window.location.href = data.hosted_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      {/* Accepted coins */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Accepted cryptocurrencies
        </p>
        <div className="grid grid-cols-3 gap-2">
          {COINS.map((coin) => (
            <div
              key={coin.symbol}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: coin.color }}
              >
                {coin.symbol.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-800 leading-none">
                  {coin.symbol}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {coin.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5 text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">Note:</span> You&apos;ll be redirected
        to Coinbase Commerce to complete payment. Your promotion activates
        automatically once the transaction is confirmed on-chain (usually within
        a few minutes).
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleCryptoPay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing payment…
          </>
        ) : (
          <>
            <Bitcoin className="w-4 h-4" />
            Pay with Crypto
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-gray-400 mt-3">
        Powered by Coinbase Commerce · 1% processing fee
      </p>
    </div>
  );
}

export default function StripeCheckoutModal({
  listingId,
  promotionType,
  pricing,
  onCloseAction,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
  const cryptoEnabled = FEATURE_FLAGS.CRYPTO_PAYMENTS;

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        promotionType,
        origin: window.location.origin,
        embedded: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error || "Failed to create checkout session");
    }
    return data.clientSecret;
  }, [listingId, promotionType]);

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {promotionType === "featured"
                ? `✨ Featured Listing — ${pricing?.featured.price ?? "€9.99"}`
                : `⚡ Quick Boost — ${pricing?.urgent.price ?? "€4.99"}`}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose your payment method below
            </p>
          </div>
          <button
            onClick={onCloseAction}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment method tabs — only rendered when crypto flag is on */}
        {cryptoEnabled && (
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                paymentMethod === "card"
                  ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Card / Bank
            </button>
            <button
              onClick={() => setPaymentMethod("crypto")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                paymentMethod === "crypto"
                  ? "text-orange-500 border-b-2 border-orange-500 -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Bitcoin className="w-4 h-4" />
              Crypto
            </button>
          </div>
        )}

        {/* Panel content */}
        <div className="overflow-y-auto flex-1">
          {cryptoEnabled && paymentMethod === "crypto" ? (
            <CryptoTab listingId={listingId} promotionType={promotionType} />
          ) : (
            <div className="p-1">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
