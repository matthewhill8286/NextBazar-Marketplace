"use client";

import { CreditCard, ExternalLink, Store } from "lucide-react";
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
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

function ShopSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Bone className="h-5 w-32" />
            <Bone className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-9 w-24 rounded-xl" />
          <Bone className="h-9 w-20 rounded-xl" />
        </div>
      </div>
      <Bone className="h-16 w-full rounded-xl" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Bone className="h-5 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
        <Bone className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
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

  // Branding form state
  const [branding, setBranding] = useState<BrandingState>({
    shopName: "",
    slug: "",
    description: "",
    accentColor: "#4f46e5",
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
          accentColor: data.accent_color ?? "#4f46e5",
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

  // ─── Conditional renders ───────────────────────────────────────────
  if (authLoading || loading) return <ShopSkeleton />;

  if (verifying) return <VerifyingSpinner />;

  if (!isActive) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
        <ProSellerCTA
          dealerPrice={dealerPrice}
          dealerInterval={dealerInterval}
          subscribing={subscribing}
          onSubscribe={handleSubscribe}
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
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
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
            <h2 className="text-lg font-bold text-gray-900">
              {branding.shopName || "Your Shop"}
            </h2>
            <p className="text-xs text-gray-500">
              Configure your shop branding and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${branding.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Shop
          </Link>
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
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
        onBannerUpload={handleBannerUpload}
        onBannerRemove={handleBannerRemove}
        onSave={handleSaveBranding}
      />
    </div>
  );
}
