"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Bitcoin, CreditCard, ExternalLink, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import type { ClientPricing } from "@/lib/stripe";

// Lazy-load Stripe only when needed (avoids ~100KB+ on every page load)
let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

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
  const t = useTranslations("checkout");
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
        <p className="text-xs font-semibold text-[#6b6560] uppercase tracking-wide mb-3">
          {t("acceptedCryptos")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {COINS.map((coin) => (
            <div
              key={coin.symbol}
              className="flex items-center gap-2 bg-[#faf9f7] border border-[#e8e6e3] px-3 py-2"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: coin.color }}
              >
                {coin.symbol.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#1a1a1a] leading-none">
                  {coin.symbol}
                </div>
                <div className="text-[10px] text-[#8a8280] truncate">
                  {coin.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 p-3 mb-5 text-xs text-amber-800 leading-relaxed">
        {t("coinbaseNote")}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-100 px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleCryptoPay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#2C2826] hover:bg-[#3D3633] disabled:opacity-60 text-white font-semibold py-3 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("preparingPayment")}
          </>
        ) : (
          <>
            <Bitcoin className="w-4 h-4" />
            {t("payWithCrypto")}
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-[#8a8280] mt-3">
        {t("poweredBy")}
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
  const t = useTranslations("checkout");
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
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e6e3]">
          <div>
            <p className="font-semibold text-[#1a1a1a] text-sm">
              {promotionType === "featured"
                ? `Featured Listing — ${pricing?.featured.price ?? "€9.99"}`
                : `Quick Boost — ${pricing?.urgent.price ?? "€4.99"}`}
            </p>
            <p className="text-xs text-[#8a8280] mt-0.5">
              {t("paymentMethod")}
            </p>
          </div>
          <button
            onClick={onCloseAction}
            className="p-1.5 hover:bg-[#f0eeeb] transition-colors text-[#8a8280] hover:text-[#666]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment method tabs — only rendered when crypto flag is on */}
        {cryptoEnabled && (
          <div className="flex border-b border-[#e8e6e3]">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                paymentMethod === "card"
                  ? "text-[#1a1a1a] border-b-2 border-[#1a1a1a] -mb-px"
                  : "text-[#8a8280] hover:text-[#666]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {t("cardTab")}
            </button>
            <button
              onClick={() => setPaymentMethod("crypto")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                paymentMethod === "crypto"
                  ? "text-orange-500 border-b-2 border-orange-500 -mb-px"
                  : "text-[#8a8280] hover:text-[#666]"
              }`}
            >
              <Bitcoin className="w-4 h-4" />
              {t("cryptoTab")}
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
                stripe={getStripe()}
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
