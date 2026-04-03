"use client";

import clsx from "clsx";
import {
  BarChart2,
  Bell,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  MessageCircle,
  Palette,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useShopCMS } from "./shop-context";

const NAV_ITEMS = [
  {
    href: "/shop-manager",
    labelKey: "tabOverview",
    icon: BarChart2,
    exact: true,
  },
  {
    href: "/shop-manager/inventory",
    labelKey: "tabInventory",
    icon: ShoppingBag,
  },
  { href: "/shop-manager/sales", labelKey: "tabSales", icon: DollarSign },
  { href: "/shop-manager/offers", labelKey: "tabOffers", icon: Tag },
  {
    href: "/shop-manager/messages",
    labelKey: "tabMessages",
    icon: MessageCircle,
  },
  {
    href: "/shop-manager/notifications",
    labelKey: "tabNotifications",
    icon: Bell,
  },
  {
    href: "/shop-manager/analytics",
    labelKey: "tabAnalytics",
    icon: TrendingUp,
  },
  {
    href: "/shop-manager/branding",
    labelKey: "tabBranding",
    icon: Palette,
  },
];

export default function ShopSidebar() {
  const t = useTranslations("dealer");
  const { shop, listings } = useShopCMS();
  const [billingLoading, setBillingLoading] = useState(false);
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/(en|el|ru)(\/|$)/, "/");

  const accentColor = shop?.accent_color ?? "#8E7A6B";
  const soldCount = listings.filter((l) => l.status === "sold").length;

  return (
    <aside className="shrink-0 w-full lg:w-[240px]">
      {/* Shop identity card */}
      <div className="bg-white border border-[#e8e6e3] p-4 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}25)`,
            }}
          >
            <Store className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-[#1a1a1a] truncate">
                {shop?.shop_name || "Your Shop"}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[10px] text-[#8a8280] uppercase tracking-wider font-medium">
                Shop Manager
              </p>
              {shop?.plan_tier && shop.plan_tier !== "starter" && (
                <span
                  className={clsx(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm",
                    shop.plan_tier === "business"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[#8E7A6B]/10 text-[#8E7A6B]",
                  )}
                >
                  {shop.plan_tier}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#f0eeeb]">
          {shop?.slug && (
            <Link
              href={`/shop/${shop.slug}`}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8E7A6B] hover:text-[#7A6657] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View Shop
            </Link>
          )}
          <span className="text-[#e8e6e3]">&middot;</span>
          <button
            disabled={billingLoading}
            onClick={async () => {
              setBillingLoading(true);
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
                  setBillingLoading(false);
                }
              } catch {
                toast.error("Network error", {
                  description: "Could not reach the server. Please try again.",
                });
                setBillingLoading(false);
              }
            }}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[#6b6560] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
          >
            {billingLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CreditCard className="w-3 h-3" />
            )}
            Billing
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border border-[#e8e6e3] p-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const NavIcon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#f0eeeb] text-[#1a1a1a]"
                  : "text-[#6b6560] hover:bg-[#faf9f7] hover:text-[#1a1a1a]",
              )}
            >
              <NavIcon className="w-4 h-4" />
              {t(item.labelKey)}
              {item.labelKey === "tabSales" && soldCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 leading-none">
                  {soldCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
