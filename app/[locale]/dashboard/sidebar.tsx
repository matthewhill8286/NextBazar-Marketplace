"use client";

import clsx from "clsx";
import {
  BarChart2,
  Bell,
  BookMarked,
  Crown,
  Flag,
  LayoutDashboard,
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
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-gray-900 truncate">
                {profile.display_name}
              </p>
              {profile.verified && (
                <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
            {profile.is_pro_seller && (
              <span className="inline-block mt-1 text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                Pro Seller
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white rounded-xl border border-gray-100 p-2">
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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === "/dashboard/shop"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Store className="w-4 h-4" />
              My Shop
            </Link>
          ) : (
            <Link
              href="/pro-sellers"
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 border border-dashed",
                "text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700",
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
