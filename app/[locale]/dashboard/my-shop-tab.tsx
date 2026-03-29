"use client";

import { CreditCard, ExternalLink, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ClientPricing } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import BrandingForm, { type BrandingState } from "./dealer/branding-form";
import ProSellerCTA from "./dealer/pro-seller-cta";
import ShopUrlCard from "./dealer/shop-url-card";
import VerifyingSpinner from "./dealer/verifying-spinner";

type DealerShop = Tables<"dealer_shops">;

type Props = {
  userId: string;
};

export default function MyShopTab({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<DealerShop | null>(null);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dealerPrice, setDealerPrice] = useState("€25");
  const [dealerInterval, setDealerInterval] = useState("month");

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
    async function load() {
      const { data } = await supabase
        .from("dealer_shops")
        .select("*")
        .eq("user_id", userId)
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
  }, [userId]);

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
    const { error } = await supabase
      .from("dealer_shops")
      .update({
        shop_name: branding.shopName,
        slug: branding.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: branding.description,
        accent_color: branding.accentColor,
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

  // ─── Conditional renders ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (verifying) return <VerifyingSpinner />;

  if (!isActive) {
    return (
      <ProSellerCTA
        dealerPrice={dealerPrice}
        dealerInterval={dealerInterval}
        subscribing={subscribing}
        onSubscribe={handleSubscribe}
      />
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
            <p className="text-xs text-[#999]">
              Configure your shop branding and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${branding.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 hover:bg-indigo-50 transition-colors"
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
        bannerUploading={false}
        onChange={handleBrandingChange}
        onBannerUpload={() => {}}
        onBannerRemove={() => {}}
        onSave={handleSaveBranding}
      />
    </div>
  );
}
