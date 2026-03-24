"use client";

import { Bell, Bookmark, MessageCircle, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { useSaved } from "@/lib/saved-context";
import GlobalSearchBar from "./global-search-bar";
import UserMenu from "./user-menu";

export default function Navbar() {
  const supabase = createClient();
  const { userId } = useCurrentUser();
  const { count: savedCount } = useSaved();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const t = useTranslations("nav");

  const loadCounts = useCallback(async () => {
    if (!userId) return;
    const [{ count: msgCount }, { count: nCount }] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", userId)
        .is("read_at", null),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false),
    ]);
    setUnreadCount(msgCount || 0);
    setNotifCount(nCount || 0);
  }, [userId]);

  // Initial load and refresh whenever userId changes
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Realtime subscriptions — all gated on userId being available
  useRealtimeTable({ channelName: "nav-msg-insert", table: "messages", event: "INSERT", onPayload: loadCounts, enabled: !!userId });
  useRealtimeTable({ channelName: "nav-msg-update", table: "messages", event: "UPDATE", onPayload: loadCounts, enabled: !!userId });
  useRealtimeTable({
    channelName: `nav-notifs-${userId ?? "anon"}`,
    table: "notifications",
    event: "*",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onPayload: loadCounts,
    enabled: !!userId,
  });

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo — full wordmark on desktop, icon only on mobile */}
        <Link href="/" className="shrink-0 flex items-center">
          {/* Desktop: full wordmark */}
          <Image
            src="/nextbazar-logo.svg"
            alt="NextBazar"
            width={220}
            height={55}
            priority
            className="hidden md:block h-10.5 w-auto"
          />
          {/* Mobile: icon only */}
          <Image
            src="/nextbazar-icon.svg"
            alt="NextBazar"
            width={40}
            height={40}
            priority
            className="md:hidden h-10 w-10"
          />
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <Suspense
            fallback={
              <div className="w-full h-[42px] rounded-xl border border-gray-100 bg-gray-50/50 animate-pulse" />
            }
          >
            <GlobalSearchBar variant="navbar" />
          </Suspense>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile search icon */}
          <Link
            href="/search"
            className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden font-medium">
              {t("messages")}
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Saved */}
          <Link
            href="/saved"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden font-medium">{t("saved")}</span>
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold min-w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {savedCount > 9 ? "9+" : savedCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link
            href="/dashboard/notifications"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden font-medium">{t("alerts")}</span>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold min-w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>

          {/* Post Ad — primary CTA */}
          <Link
            href="/post"
            className="bg-linear-to-r from-indigo-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("postAd")}</span>
          </Link>

          {/* User menu — contains Saved, Alerts, language switcher, Dashboard, Settings, Sign out */}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
