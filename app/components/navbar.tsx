"use client";

import { Bell, Heart, MessageCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSaved } from "@/lib/saved-context";
import UserMenu from "./user-menu";

export default function Navbar() {
  const supabase = createClient();
  const { count: savedCount } = useSaved();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ count: msgCount }, { count: nCount }] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .neq("sender_id", user.id)
          .is("read_at", null),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false),
      ]);

      setUnreadCount(msgCount || 0);
      setNotifCount(nCount || 0);
    }
    loadCounts();

    const channel = supabase
      .channel("nav-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, loadCounts)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, loadCounts)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, loadCounts)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, loadCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
            N
          </div>
          <span className="font-extrabold text-xl text-gray-900 hidden sm:block tracking-tight">
            Next<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Bazar</span>
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <Link href="/search" className="block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-gray-400 w-4 h-4" />
              <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 hover:border-blue-300 hover:bg-white transition-all cursor-pointer">
                Search thousands of listings...
              </div>
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            href="/search"
            className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
          </Link>

          <Link
            href="/saved"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden lg:inline font-medium">Saved</span>
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {savedCount > 99 ? "99+" : savedCount}
              </span>
            )}
          </Link>

          <Link
            href="/messages"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden lg:inline font-medium">Messages</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/notifications"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden lg:inline font-medium">Alerts</span>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>

          <Link
            href="/post"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Ad</span>
          </Link>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
