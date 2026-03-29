"use client";

import { Gift, Loader2, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function PromoCodeInput() {
  const router = useRouter();
  const { userId } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);

  async function handleRedeem() {
    if (!promoCode.trim()) return;

    // If not logged in, redirect to signup first
    if (!userId) {
      router.push(
        `/auth/signup?redirect=/pro-sellers&promo=${promoCode.trim()}`,
      );
      return;
    }

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

  if (promoSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 px-5 py-4 inline-flex items-center gap-2.5 text-emerald-700 font-medium text-sm">
        <Gift className="w-5 h-5" />
        Pro Seller activated — setting up your shop...
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] border border-[#e8e6e3] px-5 py-5 max-w-md mx-auto">
      <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#999] mb-3 flex items-center justify-center gap-1.5">
        <Ticket className="w-3.5 h-3.5 text-[#8E7A6B]" />
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
          className="flex-1 bg-white border border-[#e8e6e3] px-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#8E7A6B] focus:ring-2 focus:ring-[#8E7A6B]/5 font-mono tracking-wider transition-colors"
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
        <p className="text-red-500 text-xs mt-2 text-left">{promoError}</p>
      )}
      <p className="text-[#bbb] text-[10px] mt-2">No credit card required</p>
    </div>
  );
}
