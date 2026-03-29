"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ActivateResult = {
  success: boolean;
  listing?: {
    id: string;
    slug: string;
    title: string;
    is_promoted: boolean;
    is_urgent: boolean;
  };
  promotionType?: string;
  durationDays?: number;
  error?: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"activating" | "active" | "error">(
    "activating",
  );
  const [result, setResult] = useState<ActivateResult | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setResult({ success: false, error: "No session ID found in URL." });
      return;
    }

    async function activate() {
      try {
        const res = await fetch("/api/promote/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data: ActivateResult = await res.json();
        if (res.ok && data.success) {
          setResult(data);
          setStatus("active");
        } else {
          setResult(data);
          setStatus("error");
        }
      } catch {
        setResult({
          success: false,
          error: "Could not reach the server. Please check your dashboard.",
        });
        setStatus("error");
      }
    }

    activate();
  }, [sessionId]);

  // ── Activating ────────────────────────────────────────────────────────────
  if (status === "activating") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Activating your promotion…
          </h1>
          <p className="text-[#bbb] text-sm">Verifying payment with Stripe</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            Something went wrong
          </h1>
          <p className="text-[#999] mb-2">
            {result?.error ||
              "We couldn't activate your promotion automatically."}
          </p>
          <p className="text-sm text-[#bbb] mb-8">
            Don't worry — if your payment was successful, your listing will be
            upgraded within a few minutes. Check your dashboard or contact
            support.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/listings"
              className="bg-[#8E7A6B] text-white px-6 py-3 font-semibold hover:bg-[#7A6657] transition-colors flex items-center justify-center gap-2"
            >
              My Listings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="bg-[#f0eeeb] text-[#666] px-6 py-3 font-semibold hover:bg-[#f0eeeb] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Active ────────────────────────────────────────────────────────────────
  const isFeatured = result?.promotionType === "featured";
  const listing = result?.listing;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Checkmark */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
          Payment confirmed!
        </h1>
        <p className="text-[#999] mb-6">
          Your listing is now live with its new boost.
        </p>

        {/* Promotion badge */}
        <div
          className={`p-5 border mb-8 ${
            isFeatured
              ? "bg-linear-to-r from-amber-50 to-orange-50 border-amber-200"
              : "bg-linear-to-r from-red-50 to-rose-50 border-red-200"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-2 font-semibold mb-1 ${isFeatured ? "text-amber-800" : "text-red-700"}`}
          >
            {isFeatured ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <Star className="w-5 h-5" />
            )}
            {isFeatured ? "Featured Listing Active" : "Quick Boost Active"}
          </div>
          <p
            className={`text-sm ${isFeatured ? "text-amber-600" : "text-red-500"}`}
          >
            {isFeatured
              ? `Top placement + highlighted badge for ${result?.durationDays} days`
              : `Boosted visibility + priority in search for ${result?.durationDays} days`}
          </p>
        </div>

        {/* Listing title preview */}
        {listing?.title && (
          <p className="text-sm text-[#bbb] mb-6 truncate">
            &ldquo;{listing.title}&rdquo;
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {listing?.slug && (
            <Link
              href={`/listing/${listing.slug}`}
              className={`px-6 py-3 font-semibold transition-colors flex items-center justify-center gap-2 ${
                isFeatured
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200"
                  : "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200"
              }`}
            >
              View My Listing <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/dashboard/listings"
            className="bg-[#f0eeeb] text-[#666] px-6 py-3 font-semibold hover:bg-[#f0eeeb] transition-colors"
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PromoteSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
