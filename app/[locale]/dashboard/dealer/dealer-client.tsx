"use client";

import {
  BarChart2,
  CreditCard,
  ExternalLink,
  Palette,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ClientPricing } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { BrandingState } from "./branding-form";
import BrandingForm from "./branding-form";
import InventoryTab from "./inventory-tab";
import OverviewTab from "./overview-tab";
import ProSellerCTA from "./pro-seller-cta";
import type { ListingRow } from "./types";
import VerifyingSpinner from "./verifying-spinner";

type DealerShop = Tables<"dealer_shops">;

type Props = {
  shop: DealerShop | null;
  profile: { display_name: string | null; is_pro_seller: boolean } | null;
  listings: ListingRow[];
  userId: string;
  userEmail: string;
};

type Tab = "overview" | "branding" | "inventory";

export default function DealerDashboardClient({ shop, listings }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>("overview");
  const [subscribing, setSubscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dealerPrice, setDealerPrice] = useState("€25");
  const [dealerInterval, setDealerInterval] = useState("month");

  // Branding form state
  const [branding, setBranding] = useState<BrandingState>({
    shopName: shop?.shop_name ?? "",
    slug: shop?.slug ?? "",
    description: shop?.description ?? "",
    accentColor: shop?.accent_color ?? "#8E7A6B",
    bannerUrl: shop?.banner_url ?? "",
    website: shop?.website ?? "",
    facebook: shop?.facebook ?? "",
    instagram: shop?.instagram ?? "",
  });

  const handleBrandingChange = useCallback(
    <K extends keyof BrandingState>(key: K, value: BrandingState[K]) => {
      setBranding((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const isActive = shop?.plan_status === "active";

  // ─── Fetch pricing from DB ──────────────────────────────────────────────
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

  // ─── Post-checkout verification ─────────────────────────────────────────
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
            router.refresh();
          }
        })
        .catch((err) => {
          console.error("Failed to verify dealer session:", err);
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, shop?.plan_status, router]);

  // ─── Actions ────────────────────────────────────────────────────────────
  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setSubscribing(false);
    }
  }

  async function handleManageBilling() {
    const res = await fetch("/api/dealer/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: window.location.origin }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleSaveBranding() {
    if (!shop) return;
    setSaving(true);
    await supabase
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
    router.refresh();
  }

  // ─── Conditional renders ───────────────────────────────────────────────
  if (verifying) return <VerifyingSpinner />;

  if (!isActive) {
    return (
      <ProSellerCTA
        dealerPrice={dealerPrice}
        dealerInterval={dealerInterval}
        subscribing={subscribing}
        onSubscribeAction={handleSubscribe}
      />
    );
  }

  // ─── Active dealer dashboard ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 flex items-center justify-center shrink-0"
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
            <h1 className="text-xl md:text-2xl font-bold text-[#1a1a1a]">
              {branding.shopName || "Your Shop"}
            </h1>
            <p className="text-sm text-[#6b6560]">
              Sellers Pro &mdash; manage your brand, listings, and analytics
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

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f0eeeb] p-1 w-fit">
        {(
          [
            { key: "overview", label: "Overview", icon: BarChart2 },
            { key: "branding", label: "Branding", icon: Palette },
            { key: "inventory", label: "Inventory", icon: ShoppingBag },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-white text-[#1a1a1a] shadow-sm"
                : "text-[#6b6560] hover:text-[#666]"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab listings={listings} slug={branding.slug} />
      )}

      {tab === "branding" && (
        <BrandingForm
          state={branding}
          saving={saving}
          bannerUploading={false}
          onChange={handleBrandingChange}
          onBannerUploadAction={() => {}}
          onBannerRemoveAction={() => {}}
          onSaveAction={handleSaveBranding}
        />
      )}

      {tab === "inventory" && <InventoryTab listings={listings} />}
    </div>
  );
}
