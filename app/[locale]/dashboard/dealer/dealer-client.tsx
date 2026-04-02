"use client";

import {
  BarChart2,
  CreditCard,
  DollarSign,
  ExternalLink,
  MessageCircle,
  Palette,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import type { ClientPricing } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import AnalyticsTab from "./analytics-tab";
import type { BrandingState } from "./branding-form";
import BrandingForm from "./branding-form";
import InventoryTab from "./inventory-tab";
import MessagesTab from "./messages-tab";
import OffersTab from "./offers-tab";
import OverviewTab from "./overview-tab";
import ProSellerCTA from "./pro-seller-cta";
import SalesTab from "./sales-tab";
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

type Tab =
  | "overview"
  | "branding"
  | "inventory"
  | "sales"
  | "offers"
  | "messages"
  | "analytics";

const TABS = [
  { key: "overview" as const, labelKey: "tabOverview", icon: BarChart2 },
  { key: "inventory" as const, labelKey: "tabInventory", icon: ShoppingBag },
  { key: "sales" as const, labelKey: "tabSales", icon: DollarSign },
  { key: "offers" as const, labelKey: "tabOffers", icon: Tag },
  { key: "messages" as const, labelKey: "tabMessages", icon: MessageCircle },
  { key: "analytics" as const, labelKey: "tabAnalytics", icon: TrendingUp },
  { key: "branding" as const, labelKey: "tabBranding", icon: Palette },
];

export default function DealerDashboardClient({ shop, listings }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const t = useTranslations("dealer");

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

  // ─── Counts for tab badges ──────────────────────────────────────────
  const pendingOffersBadge = ""; // loaded dynamically in OffersTab
  const unreadMsgBadge = ""; // loaded dynamically in MessagesTab
  const soldCount = listings.filter((l) => l.status === "sold").length;

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
            router.refresh();
          }
        })
        .catch((err) => {
          console.error("Failed to verify dealer session:", err);
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, shop?.plan_status, router]);

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

  // ─── Conditional renders ───────────────────────────────────────────
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

  // ─── Active dealer dashboard — Full CMS ────────────────────────────
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
              Pro Seller CMS &mdash; manage your brand, inventory, sales &amp;
              analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${branding.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8E7A6B] hover:text-[#7A6657] px-3 py-2 hover:bg-[#f0eeeb] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("viewShop")}
          </Link>
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666] hover:text-[#1a1a1a] px-3 py-2 hover:bg-[#faf9f7] transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {t("billing")}
          </button>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 bg-[#f0eeeb] p-1 w-fit min-w-full sm:min-w-0">
          {TABS.map((tabConfig) => {
            const TabIcon = tabConfig.icon;
            return (
              <button
                key={tabConfig.key}
                onClick={() => setTab(tabConfig.key)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold transition-all whitespace-nowrap ${
                  tab === tabConfig.key
                    ? "bg-white text-[#1a1a1a] shadow-sm"
                    : "text-[#6b6560] hover:text-[#666]"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t(tabConfig.labelKey)}
                </span>
                {/* Show sold count badge on sales tab */}
                {tabConfig.key === "sales" && soldCount > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 leading-none">
                    {soldCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab listings={listings} slug={branding.slug} />
      )}

      {tab === "inventory" && <InventoryTab listings={listings} />}

      {tab === "sales" && <SalesTab listings={listings} />}

      {tab === "offers" && <OffersTab />}

      {tab === "messages" && <MessagesTab />}

      {tab === "analytics" && <AnalyticsTab listings={listings} />}

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
    </div>
  );
}
