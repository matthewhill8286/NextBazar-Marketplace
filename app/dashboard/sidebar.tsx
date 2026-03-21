"use client";

import clsx from "clsx";
import {
  BarChart2,
  Bell,
  Eye,
  Flag,
  Heart,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  profile: {
    display_name: string;
    email: string;
    avatar_url: string | null;
    verified: boolean;
    is_dealer: boolean;
  };
  stats: {
    active: number;
    sold: number;
    views: number;
    favorites: number;
  };
  isAdmin?: boolean;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/listings", label: "My Listings", icon: Package },
  { href: "/dashboard/offers", label: "Offers", icon: Tag },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/saved-searches", label: "Saved Searches", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({ profile, stats, isAdmin }: SidebarProps) {
  const pathname = usePathname();

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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
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
                <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
            {profile.is_dealer && (
              <span className="inline-block mt-1 text-[10px] font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                Dealer Account
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-gray-900">
              {stats.active}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Active</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="text-lg font-bold text-gray-900">{stats.sold}</div>
            <div className="text-[10px] text-gray-500 font-medium">Sold</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Eye className="w-3 h-3 text-gray-400" />
              <span className="text-lg font-bold text-gray-900">
                {stats.views >= 1000
                  ? `${(stats.views / 1000).toFixed(1)}k`
                  : stats.views}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Views</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-gray-400" />
              <span className="text-lg font-bold text-gray-900">
                {stats.favorites}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-medium">Saved</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white rounded-xl border border-gray-100 p-2">
        {[...NAV_ITEMS, ...(isAdmin ? [{ href: "/admin/reports", label: "Reports Queue", icon: Flag }] : [])].map((item) => {
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
