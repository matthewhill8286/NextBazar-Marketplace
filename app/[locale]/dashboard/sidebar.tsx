"use client";

import clsx from "clsx";
import {
  BarChart2,
  Bell,
  BookMarked,
  CreditCard,
  Crown,
  DollarSign,
  Flag,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Palette,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";

const TIER_STYLES: Record<string, { bg: string; text: string; label: string }> =
  {
    starter: { bg: "bg-[#f0eeeb]", text: "text-[#6b6560]", label: "STARTER" },
    pro: { bg: "bg-[#f5f0eb]", text: "text-[#8E7A6B]", label: "PRO" },
    business: { bg: "bg-amber-50", text: "text-amber-700", label: "BUSINESS" },
  };

type SidebarProps = {
  profile: {
    display_name: string;
    email: string;
    avatar_url: string | null;
    verified: boolean;
    is_pro_seller: boolean;
    plan_tier: string | null;
  };
  isAdmin?: boolean;
};

export default function DashboardSidebar({ profile, isAdmin }: SidebarProps) {
  const t = useTranslations("dashboard");
  const rawPathname = usePathname();
  // Strip locale prefix so href comparisons work correctly
  const pathname = rawPathname.replace(/^\/(en|el|ru)(\/|$)/, "/");

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard },
    {
      href: "/dashboard/messages",
      label: t("nav.messages"),
      icon: MessageCircle,
    },
    { href: "/dashboard/saved", label: t("nav.saved"), icon: Heart },
    { href: "/dashboard/offers", label: t("nav.offers"), icon: Tag },
    {
      href: "/dashboard/purchases",
      label: t("nav.purchases"),
      icon: ShoppingBag,
    },
    {
      href: "/dashboard/notifications",
      label: t("nav.notifications"),
      icon: Bell,
    },
    {
      href: "/dashboard/saved-searches",
      label: t("nav.savedSearches"),
      icon: BookMarked,
    },
    { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
  ];

  // Pro Seller tabs — only shown for active Pro Sellers
  const PRO_SELLER_ITEMS = [
    {
      href: "/dashboard/inventory",
      label: t("nav.inventory"),
      icon: Store,
    },
    {
      href: "/dashboard/sales",
      label: t("nav.sales"),
      icon: DollarSign,
    },
    {
      href: "/dashboard/analytics",
      label: t("nav.analytics"),
      icon: TrendingUp,
    },
    {
      href: "/dashboard/branding",
      label: t("nav.branding"),
      icon: Palette,
    },
    {
      href: "/dashboard/plan",
      label: t("nav.plan"),
      icon: CreditCard,
    },
  ];

  const initials =
    profile.display_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  function renderNavLink(item: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }) {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
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
        <item.icon className="w-4 h-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#8E7A6B] flex items-center justify-center text-white font-medium text-lg shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-[#1a1a1a] truncate">
                {profile.display_name}
              </p>
              {profile.verified && (
                <Shield className="w-4 h-4 text-[#6b6560] shrink-0" />
              )}
            </div>
            <p className="text-xs text-[#6b6560] truncate">{profile.email}</p>
            {profile.is_pro_seller && profile.plan_tier && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 mt-1 text-[9px] font-semibold px-2 py-0.5 tracking-[0.12em] uppercase",
                  TIER_STYLES[profile.plan_tier]?.bg ?? "bg-[#f0eeeb]",
                  TIER_STYLES[profile.plan_tier]?.text ?? "text-[#666]",
                )}
              >
                {profile.plan_tier === "business" && (
                  <Crown className="w-2.5 h-2.5" />
                )}
                {TIER_STYLES[profile.plan_tier]?.label ?? t("proSeller")}
              </span>
            )}
            {profile.is_pro_seller && !profile.plan_tier && (
              <span className="inline-block mt-1 text-[9px] font-medium bg-[#f0eeeb] text-[#666] px-2 py-0.5 tracking-[0.15em] uppercase">
                {t("proSeller")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border border-[#e8e6e3] p-2">
        {NAV_ITEMS.map(renderNavLink)}

        {/* Admin */}
        {isAdmin &&
          FEATURE_FLAGS.REPORTS &&
          renderNavLink({
            href: "/admin/reports",
            label: t("nav.reportsQueue"),
            icon: Flag,
          })}

        {/* ── Pro Seller section ────────────────────────────────────── */}
        {FEATURE_FLAGS.DEALERS && profile.is_pro_seller && (
          <>
            <div className="my-2 mx-3 border-t border-[#e8e6e3]" />
            <p className="px-3 pt-1 pb-2 text-[9px] font-semibold text-[#8a8280] tracking-[0.2em] uppercase">
              Pro Seller
            </p>
            {PRO_SELLER_ITEMS.map(renderNavLink)}
          </>
        )}

        {/* Non-pro upgrade CTA */}
        {FEATURE_FLAGS.DEALERS && !profile.is_pro_seller && (
          <>
            <div className="my-2 mx-3 border-t border-[#e8e6e3]" />
            <Link
              href="/pricing"
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors",
                "text-[#6b6560] border border-dashed border-[#e8e6e3] hover:bg-[#faf9f7] hover:text-[#1a1a1a]",
              )}
            >
              <Crown className="w-4 h-4" />
              {t("nav.becomeProSeller")}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
