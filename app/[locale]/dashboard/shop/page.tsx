"use client";

import {
  AlertTriangle,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Store,
  StoreIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { ClientPricing } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import BrandingForm, { type BrandingState } from "../dealer/branding-form";
import ProSellerCTA from "../dealer/pro-seller-cta";
import ShopUrlCard from "../dealer/shop-url-card";
import VerifyingSpinner from "../dealer/verifying-spinner";

type DealerShop = Tables<"dealer_shops">;

/* ── Skeleton ────────────────────────────────────────────────────────────── */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8e6e3] ${className}`} />;
}

function ShopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 " />
          <div className="space-y-2">
            <Bone className="h-5 w-32" />
            <Bone className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-9 w-24 " />
          <Bone className="h-9 w-20 " />
        </div>
      </div>
      <Bone className="h-16 w-full " />
      <div className="bg-white border border-[#e8e6e3] p-6 space-y-4">
        <Bone className="h-5 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Bone className="h-10 w-full " />
          <Bone className="h-10 w-full " />
        </div>
        <Bone className="h-24 w-full " />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Bone className="h-10 w-full " />
          <Bone className="h-10 w-full " />
          <Bone className="h-10 w-full " />
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function ShopPage() {
  const { userId, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<DealerShop | null>(null);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [dealerPrice, setDealerPrice] = useState("€25");
  const [dealerInterval, setDealerInterval] = useState("month");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);

  // Branding form state
  const [branding, setBranding] = useState<BrandingState>({
    shopName: "",
    slug: "",
    description: "",
    accentColor: "#8E7A6B",
    bannerUrl: "",
    website: "",
    facebook: "",
    instagram: "",
  });

  const handleBrandingChange = useCallback(
    <K extends keyof BrandingState>(key: K, value: BrandingState[K]) => {
      setBranding((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ─── Load shop data ──────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !userId) return;
    async function load() {
      const { data } = await supabase
        .from("dealer_shops")
        .select("*")
        .eq("user_id", userId!)
        .single();

      if (data) {
        setShop(data);
        setBranding({
          shopName: data.shop_name ?? "",
          slug: data.slug ?? "",
          description: data.description ?? "",
          accentColor: data.accent_color ?? "#8E7A6B",
          bannerUrl: data.banner_url ?? "",
          website: data.website ?? "",
          facebook: data.facebook ?? "",
          instagram: data.instagram ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [userId, authLoading]);

  // ─── Fetch pricing from DB ──────────────────────────────────────────
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

  // ─── Post-checkout verification ─────────────────────────────────────
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
            router.refresh();
          }
        })
        .catch(() => {
          toast.error("Verification failed", {
            description:
              "We couldn't verify your subscription. Please refresh the page.",
          });
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, shop?.plan_status, router]);

  const isActive = shop?.plan_status === "active";
  const isClosed = shop?.plan_status === "closed";

  // ─── Actions ────────────────────────────────────────────────────────
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
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
      setSubscribing(false);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/dealer/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not open billing portal", {
          description: data.error || "Please try again later.",
        });
      }
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
    }
  }

  async function handleSaveBranding() {
    if (!shop) return;
    setSaving(true);

    // Only set the slug on first save; once persisted it never changes.
    const slugValue = shop.slug
      ? shop.slug
      : branding.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const { error } = await supabase
      .from("dealer_shops")
      .update({
        shop_name: branding.shopName,
        slug: slugValue,
        description: branding.description,
        accent_color: branding.accentColor,
        banner_url: branding.bannerUrl || null,
        website: branding.website || null,
        facebook: branding.facebook || null,
        instagram: branding.instagram || null,
      })
      .eq("id", shop.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to save changes", { description: error.message });
    } else {
      toast.success("Shop branding updated");
      router.refresh();
    }
  }

  // ─── Banner upload ─────────────────────────────────────────────────
  async function handleBannerUpload(file: File) {
    if (!userId || !shop) return;
    setBannerUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/banner.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error("Banner upload failed", { description: error.message });
        setBannerUploading(false);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Persist to DB immediately
      await supabase
        .from("dealer_shops")
        .update({ banner_url: urlWithCacheBust })
        .eq("id", shop.id);

      setBranding((prev) => ({ ...prev, bannerUrl: urlWithCacheBust }));
      toast.success("Banner uploaded");
    } catch {
      toast.error("Banner upload failed");
    }
    setBannerUploading(false);
  }

  async function handleBannerRemove() {
    if (!shop) return;
    await supabase
      .from("dealer_shops")
      .update({ banner_url: null })
      .eq("id", shop.id);
    setBranding((prev) => ({ ...prev, bannerUrl: "" }));
    toast.success("Banner removed");
  }

  // ─── Close / reopen shop ──────────────────────────────────────────
  async function handleCloseShop() {
    setClosing(true);
    try {
      const res = await fetch("/api/dealer/close-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to close shop", {
          description: data.error || "Please try again.",
        });
        setClosing(false);
        return;
      }

      toast.success("Shop closed", {
        description: "Your shop and listings are no longer visible to buyers.",
      });
      setShowCloseConfirm(false);
      router.refresh();
      // Reload to reflect new state
      window.location.reload();
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
      setClosing(false);
    }
  }

  async function handleReopenShop() {
    setReopening(true);
    try {
      const res = await fetch("/api/dealer/reopen-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.status === 402 && data.requiresSubscription) {
        // Need to re-subscribe via Stripe
        toast.info("Subscription required", {
          description: "Redirecting you to subscribe again...",
        });
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

      toast.success("Shop reopened!", {
        description: "Your shop is back online.",
      });
      router.refresh();
      window.location.reload();
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
      setReopening(false);
    }
  }

  // ─── Conditional renders ───────────────────────────────────────────
  if (authLoading || loading) return <ShopSkeleton />;

  if (verifying) return <VerifyingSpinner />;

  // ─── Closed shop — show reopen option ─────────────────────────────
  if (isClosed) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">My Shop</h1>

        <div className="bg-white border border-[#e8e6e3] p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-5">
            <StoreIcon className="w-8 h-8 text-[#8a8280]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
            Your shop is closed
          </h2>
          <p className="text-sm text-[#6b6560] max-w-md mx-auto mb-6">
            Your shop and listings are no longer visible to buyers. You can
            reopen your shop at any time to pick up where you left off.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReopenShop}
              disabled={reopening}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8E7A6B] text-white font-semibold text-sm hover:bg-[#7A6657] transition-colors disabled:opacity-50 shadow-sm shadow-[#8E7A6B]/15"
            >
              {reopening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Reopen My Shop
            </button>
          </div>

          {shop?.stripe_subscription_id && (
            <p className="text-xs text-[#8a8280] mt-4">
              Your Stripe subscription was cancelled. Reopening will require a
              new subscription.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="space-y-6">
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

  // ─── Active Pro Seller — shop setup & branding ─────────────────────
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${branding.accentColor}15, ${branding.accentColor}25)`,
            }}
          >
            <Store
              className="w-5 h-5"
              style={{ color: branding.accentColor }}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              {branding.shopName || "Your Shop"}
            </h2>
            <p className="text-xs text-[#6b6560]">
              Configure your shop branding and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${branding.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8E7A6B] hover:text-[#7A6657] px-3 py-2 hover:bg-[#f0eeeb] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Shop
          </Link>
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666] hover:text-[#1a1a1a] px-3 py-2 hover:bg-[#faf9f7] transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </button>
        </div>
      </div>

      {/* Shop URL */}
      <ShopUrlCard slug={branding.slug} />

      {/* Branding form */}
      <BrandingForm
        state={branding}
        saving={saving}
        bannerUploading={bannerUploading}
        slugLocked={!!shop?.slug}
        onChange={handleBrandingChange}
        onBannerUploadAction={handleBannerUpload}
        onBannerRemoveAction={handleBannerRemove}
        onSaveAction={handleSaveBranding}
      />

      {/* ── Close Shop — danger zone ────────────────────────────────── */}
      <div className="border border-red-100 overflow-hidden">
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
                  Your shop page and all active listings will be hidden from
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
                <ul className="text-xs text-red-700 space-y-1 mt-2">
                  <li>• Your shop page will no longer be visible to buyers</li>
                  <li>• All your active listings will be set to inactive</li>
                  {shop?.stripe_subscription_id && (
                    <li>• Your Stripe subscription will be cancelled</li>
                  )}
                  <li>
                    • You can reopen your shop later — your branding and
                    settings will be preserved
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
  );
}
