"use client";

import { Bell, Heart, MessageCircle, Plus, Search, Store } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { useUserShop } from "@/lib/hooks/use-user-shop";
import { useSaved } from "@/lib/saved-context";
import { createClient } from "@/lib/supabase/client";
import GlobalSearch from "./global-search";
import {
  MessagesPreview,
  NavPreviewWrapper,
  NotificationsPreview,
  SavedPreview,
} from "./nav-previews";
import UserMenu from "./user-menu";

export default function Navbar() {
  const supabase = createClient();
  const { userId } = useCurrentUser();
  const { hasShop } = useUserShop();
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedLoadCounts = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadCounts(), 500);
  }, [loadCounts]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useRealtimeTable({
    channelName: "nav-msg-insert",
    table: "messages",
    event: "INSERT",
    onPayload: debouncedLoadCounts,
    enabled: !!userId,
  });
  useRealtimeTable({
    channelName: "nav-msg-update",
    table: "messages",
    event: "UPDATE",
    onPayload: debouncedLoadCounts,
    enabled: !!userId,
  });
  useRealtimeTable({
    channelName: `nav-notifs-${userId ?? "anon"}`,
    table: "notifications",
    event: "*",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onPayload: debouncedLoadCounts,
    enabled: !!userId,
  });

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#e8e6e3]/60"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/nextbazar-logo-beta.svg"
            alt="NextBazar"
            width={180}
            height={55}
            style={{ width: 180, height: 55 }}
            priority
            className="hidden md:block h-9 w-auto"
          />
          <Image
            src="/nextbazar-icon.svg"
            alt="NextBazar"
            width={40}
            height={40}
            style={{ width: 40, height: 40 }}
            priority
            className="md:hidden h-9 w-9"
          />
        </Link>

        {/* Global search */}
        <GlobalSearch />

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {FEATURE_FLAGS.DEALERS && (
            <Link
              href="/shops"
              className="hidden md:flex items-center gap-1.5 text-xs text-[#666] hover:text-[#1a1a1a] px-3 py-2 transition-colors font-medium tracking-wide"
            >
              <Store className="w-4 h-4" />
              <span>{t("shops")}</span>
            </Link>
          )}

          <Link
            href="/search"
            aria-label="Search listings"
            className="md:hidden p-2.5 text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </Link>

          {userId && (
            <NavPreviewWrapper
              href="/dashboard/messages"
              badge={unreadCount}
              badgeColor="bg-[#8E7A6B]"
              label="Messages"
              icon={<MessageCircle className="w-4 h-4" aria-hidden="true" />}
            >
              {() => <MessagesPreview shopMode={hasShop} />}
            </NavPreviewWrapper>
          )}

          {userId && (
            <NavPreviewWrapper
              href="/dashboard/saved"
              badge={savedCount}
              badgeColor="bg-[#8E7A6B]"
              label="Saved listings"
              icon={<Heart className="w-4 h-4" aria-hidden="true" />}
            >
              {() => <SavedPreview />}
            </NavPreviewWrapper>
          )}

          {userId && (
            <NavPreviewWrapper
              href="/dashboard/notifications"
              badge={notifCount}
              badgeColor="bg-[#8E7A6B]"
              label="Notifications"
              icon={<Bell className="w-4 h-4" aria-hidden="true" />}
            >
              {() => <NotificationsPreview shopMode={hasShop} />}
            </NavPreviewWrapper>
          )}

          {/* Post-Ad CTA */}
          <Link
            href="/post"
            className="bg-[#8E7A6B] text-white px-5 py-2.5 text-[10px] font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-colors flex items-center gap-2 ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("postAd")}</span>
          </Link>

          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
