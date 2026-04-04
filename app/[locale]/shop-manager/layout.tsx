"use client";

import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  StoreIcon,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import type { ClientPricing } from "@/lib/stripe";
import ProSellerCTA from "../dashboard/dealer/pro-seller-cta";
import VerifyingSpinner from "../dashboard/dealer/verifying-spinner";
import { useShopCMS } from "./shop-context";
import ShopDataLoader from "./shop-data-loader";
import ShopSidebar from "./shop-sidebar";

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

function ShopSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-3">
          <Bone className="h-5 w-32" />
          <Bone className="h-24 w-full" />
          <Bone className="h-72 w-full" />
        </aside>
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Bone key={i} className="h-28 w-full" />
            ))}
          </div>
          <Bone className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Inner layout (has access to ShopCMS context) ─────────────────────── */
function ShopManagerInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shop, loading } = useShopCMS();

  const [subscribing, setSubscribing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dealerPrice, setDealerPrice] = useState("€25");
  const [dealerInterval, setDealerInterval] = useState("month");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  // ─── Fetch pricing ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((p: ClientPricing) => {
        if (p?.dealer) {
          setDealerPrice(p.dealer.price);
          setDealerInterval(p.dealer.interval);
        }
      })
      .catch(() => {});
  }, []);

  // ─── Post-checkout verification ───────────────────────────────────
  useEffect(() => {
    const isSetup = searchParams.get("setup") === "true";
    const sessionId = searchParams.get("session_id");

    if (isSetup && sessionId && !shop?.plan_status) {
      setVerifying(true);
      fetch("/api/dealer/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "activated" || data.status === "already_active") {
            toast.success("Welcome to Pro Seller!", {
              description: "Your account has been activated.",
            });
            window.location.reload();
          }
        })
        .catch(() => {
          toast.error("Verification failed", {
            description: "Please refresh the page.",
          });
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, shop?.plan_status, router]);

  const isActive = shop?.plan_status === "active";
  const isClosed = shop?.plan_status === "closed";

  // ─── Actions ──────────────────────────────────────────────────────
  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Something went wrong", {
          description: data.error || "Could not start checkout",
        });
        setSubscribing(false);
      }
    } catch {
      toast.error("Network error");
      setSubscribing(false);
    }
  }

  async function handleCloseShop() {
    setClosing(true);
    try {
      const res = await fetch("/api/dealer/close-shop", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to close shop", {
          description: data.error || "Please try again.",
        });
        setClosing(false);
        return;
      }
      toast.success("Shop closed");
      setShowCloseConfirm(false);
      window.location.reload();
    } catch {
      toast.error("Network error");
      setClosing(false);
    }
  }

  async function handleReopenShop() {
    setReopening(true);
    try {
      const res = await fetch("/api/dealer/reopen-shop", {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 402 && data.requiresSubscription) {
        toast.info("Subscription required");
        setReopening(false);
        handleSubscribe();
        return;
      }
      if (!res.ok) {
        toast.error("Failed to reopen shop", {
          description: data.error || "Please try again.",
        });
        setReopening(false);
        return;
      }
      toast.success("Shop reopened!");
      window.location.reload();
    } catch {
      toast.error("Network error");
      setReopening(false);
    }
  }

  // ─── Conditional renders ──────────────────────────────────────────
  if (loading) return <ShopSkeleton />;
  if (verifying) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <VerifyingSpinner />
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="bg-white border border-[#e8e6e3] p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-5">
            <StoreIcon className="w-8 h-8 text-[#8a8280]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Your shop is closed
          </h2>
          <p className="text-sm text-[#6b6560] max-w-md mx-auto mb-6">
            Your shop and listings are no longer visible to buyers. You can
            reopen at any time.
          </p>
          <button
            onClick={handleReopenShop}
            disabled={reopening}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors disabled:opacity-50 shadow-sm"
          >
            {reopening ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Reopen My Shop
          </button>
          {shop?.stripe_subscription_id && (
            <p className="text-xs text-[#8a8280] mt-4">
              Reopening will require a new subscription.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">My Shop</h1>
        <ProSellerCTA
          dealerPrice={dealerPrice}
          dealerInterval={dealerInterval}
          subscribing={subscribing}
          onSubscribeAction={handleSubscribe}
        />
      </div>
    );
  }

  // ─── Active Pro Seller — full CMS ─────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <ShopSidebar />
        <div className="min-w-0 space-y-6">
          {children}

          {/* ── Danger zone — always visible at bottom ──────────────── */}
          <div className="border border-red-100 overflow-hidden mt-8">
            <div className="px-6 py-4 bg-red-50/50 border-b border-red-100">
              <h3 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
            </div>
            <div className="px-6 py-5 bg-white">
              {!showCloseConfirm ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">
                      Close your shop
                    </p>
                    <p className="text-xs text-[#6b6560] mt-0.5">
                      Your shop and all active listings will be hidden from
                      buyers. You can reopen at any time.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCloseConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Close Shop
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-100 p-4">
                    <p className="text-sm font-semibold text-red-800 mb-1">
                      Are you sure you want to close your shop?
                    </p>
                    <p className="text-xs text-red-700 mt-1 mb-2">
                      You will be downgraded to the free Starter plan (max 5
                      listings, no shop page). Here&apos;s what you&apos;ll lose:
                    </p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>&bull; Your branded shop page will be hidden</li>
                      <li>&bull; All active listings will be set to inactive</li>
                      <li>
                        &bull; Shop analytics and priority placement will stop
                      </li>
                      {shop?.stripe_subscription_id && (
                        <li>
                          &bull; Your Stripe subscription will be cancelled
                          immediately
                        </li>
                      )}
                      {shop?.plan_tier === "business" && (
                        <li>
                          &bull; Unlimited listings and Business features will be
                          removed
                        </li>
                      )}
                      <li>
                        &bull; You can reopen later &mdash; branding and settings
                        will be preserved
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCloseShop}
                      disabled={closing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {closing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Yes, Close My Shop
                    </button>
                    <button
                      onClick={() => setShowCloseConfirm(false)}
                      className="text-sm text-[#6b6560] hover:text-[#666] font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Outer layout — wraps in data loader ──────────────────────────────── */
export default function ShopManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopDataLoader>
      <ShopManagerInner>{children}</ShopManagerInner>
    </ShopDataLoader>
  );
}
