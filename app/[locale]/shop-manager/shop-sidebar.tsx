"use client";

import clsx from "clsx";
import {
  ArrowLeft,
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
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/(en|el|ru)(\/|$)/, "/");

  const accentColor = shop?.accent_color ?? "#8E7A6B";
  const soldCount = listings.filter((l) => l.status === "sold").length;

  return (
    <aside className="shrink-0 w-full lg:w-[240px]">
      {/* Back to Dashboard */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-xs font-medium text-[#8a8280] hover:text-[#1a1a1a] transition-colors mb-3 px-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

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
            <h2 className="text-sm font-bold text-[#1a1a1a] truncate">
              {shop?.shop_name || "Your Shop"}
            </h2>
            <p className="text-[10px] text-[#8a8280] uppercase tracking-wider font-medium">
              Shop Manager
            </p>
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
            onClick={async () => {
              const res = await fetch("/api/dealer/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ origin: window.location.origin }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
          >
            <CreditCard className="w-3 h-3" />
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
