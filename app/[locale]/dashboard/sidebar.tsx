"use client";

import clsx from "clsx";
import {
  BarChart2,
  Bell,
  BookMarked,
  Crown,
  Flag,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";

type SidebarProps = {
  profile: {
    display_name: string;
    email: string;
    avatar_url: string | null;
    verified: boolean;
    is_pro_seller: boolean;
  };
  isAdmin?: boolean;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/saved", label: "Saved", icon: Heart },
  { href: "/dashboard/offers", label: "Offers", icon: Tag },
  { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  {
    href: "/dashboard/saved-searches",
    label: "Saved Searches",
    icon: BookMarked,
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({ profile, isAdmin }: SidebarProps) {
  const rawPathname = usePathname();
  // Strip locale prefix (/en/ or /el/) so href comparisons work correctly
  const pathname = rawPathname.replace(/^\/(en|el)(\/|$)/, "/");

  const initials =
    profile.display_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <aside className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#8E7A6B] flex items-center justify-center text-white font-medium text-lg shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
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
                <Shield className="w-4 h-4 text-[#999] shrink-0" />
              )}
            </div>
            <p className="text-xs text-[#999] truncate">{profile.email}</p>
            {profile.is_pro_seller && (
              <span className="inline-block mt-1 text-[9px] font-medium bg-[#f0eeeb] text-[#666] px-2 py-0.5 tracking-[0.15em] uppercase">
                Pro Seller
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border border-[#e8e6e3] p-2">
        {[
          ...NAV_ITEMS,
          ...(isAdmin && FEATURE_FLAGS.REPORTS
            ? [{ href: "/admin/reports", label: "Reports Queue", icon: Flag }]
            : []),
        ].map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#f0eeeb] text-[#1a1a1a]"
                  : "text-[#999] hover:bg-[#faf9f7] hover:text-[#1a1a1a]",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {/* My Shop — Pro Sellers get a direct link, others see upgrade CTA */}
        {FEATURE_FLAGS.DEALERS &&
          (profile.is_pro_seller ? (
            <Link
              href="/dashboard/shop"
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/dashboard/shop"
                  ? "bg-[#f0eeeb] text-[#1a1a1a]"
                  : "text-[#999] hover:bg-[#faf9f7] hover:text-[#1a1a1a]",
              )}
            >
              <Store className="w-4 h-4" />
              My Shop
            </Link>
          ) : (
            <Link
              href="/pro-sellers"
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors mt-1 border border-dashed",
                "text-[#999] border-[#e8e6e3] hover:bg-[#faf9f7] hover:text-[#1a1a1a]",
              )}
            >
              <Crown className="w-4 h-4" />
              Become a Pro Seller
            </Link>
          ))}
      </nav>
    </aside>
  );
}
