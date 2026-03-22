"use client";

import { Bell, Heart, MessageCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "./user-menu";
import GlobalSearchBar from "./global-search-bar";

export default function Navbar() {
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const t = useTranslations("nav");

  useEffect(() => {
    async function loadCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", user.id)
        .is("read_at", null);

      setUnreadCount(msgCount || 0);
    }
    loadCounts();

    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, loadCounts)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, loadCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
          <Suspense fallback={
            <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
              {t("searchPlaceholder")}
            </div>
          }>
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

          {/* Messages — kept top-level for quick access to unread badge */}
          <Link
            href="/messages"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden lg:inline font-medium">{t("messages")}</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Post Ad — primary CTA */}
          <Link
            href="/post"
            className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300"
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
