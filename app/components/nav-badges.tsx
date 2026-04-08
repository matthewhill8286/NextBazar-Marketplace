"use client";

import { Bell, Heart, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { useUserShop } from "@/lib/hooks/use-user-shop";
import { useSaved } from "@/lib/saved-context";
import { createClient } from "@/lib/supabase/client";
import {
  MessagesPreview,
  NavPreviewWrapper,
  NotificationsPreview,
  SavedPreview,
} from "./nav-previews";

type NavBadgesProps = {
  /**
   * Initial counts SSR'd by the layout so the badge widget paints correct
   * values on first render without two extra client-side round trips. The
   * realtime subscriptions below keep them fresh after hydration.
   */
  initialUnreadMessages?: number;
  initialUnreadNotifications?: number;
};

/**
 * Isolated client island that owns the realtime-driven unread counts for the
 * messages / saved / notifications navbar icons. Kept separate from <Navbar />
 * so that realtime state changes only re-render this small subtree instead of
 * the entire nav (which would otherwise re-trigger Link prefetch logic).
 */
export default function NavBadges({
  initialUnreadMessages = 0,
  initialUnreadNotifications = 0,
}: NavBadgesProps) {
  const { userId } = useCurrentUser();
  const { hasShop } = useUserShop();
  const { count: savedCount } = useSaved();
  const [unreadCount, setUnreadCount] = useState(initialUnreadMessages);
  const [notifCount, setNotifCount] = useState(initialUnreadNotifications);

  const loadCounts = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
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

  // Skip the initial client-side fetch when the server already SSR'd values.
  // Realtime subscriptions below will keep them fresh.
  const didInitialFetch = useRef(
    initialUnreadMessages > 0 || initialUnreadNotifications > 0,
  );
  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
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

  if (!userId) return null;

  return (
    <>
      <NavPreviewWrapper
        href="/dashboard/messages"
        badge={unreadCount}
        badgeColor="bg-[#8E7A6B]"
        label="Messages"
        icon={<MessageCircle className="w-4 h-4" aria-hidden="true" />}
      >
        {() => <MessagesPreview shopMode={hasShop} />}
      </NavPreviewWrapper>

      <NavPreviewWrapper
        href="/dashboard/saved"
        badge={savedCount}
        badgeColor="bg-[#8E7A6B]"
        label="Saved listings"
        icon={<Heart className="w-4 h-4" aria-hidden="true" />}
      >
        {() => <SavedPreview />}
      </NavPreviewWrapper>

      <NavPreviewWrapper
        href="/dashboard/notifications"
        badge={notifCount}
        badgeColor="bg-[#8E7A6B]"
        label="Notifications"
        icon={<Bell className="w-4 h-4" aria-hidden="true" />}
      >
        {() => <NotificationsPreview shopMode={hasShop} />}
      </NavPreviewWrapper>
    </>
  );
}
