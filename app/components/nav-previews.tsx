"use client";

import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useSaved } from "@/lib/saved-context";
import { createClient } from "@/lib/supabase/client";

// ─── Shared preview wrapper ──────────────────────────────────────────────────

type WrapperProps = {
  href: string;
  badge?: number;
  badgeColor?: string;
  icon: ReactNode;
  label?: string;
  children: (opts: { load: () => void }) => ReactNode;
};

/**
 * Wrap a nav icon-link.  On hover (with a short delay) a dropdown appears
 * below the icon.  The dropdown is rendered lazily — `children` receives a
 * `load` callback that fires on first hover.
 */
export function NavPreviewWrapper({
  href,
  badge,
  badgeColor = "bg-red-500",
  icon,
  label,
  children,
}: WrapperProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => {
      setOpen(true);
      if (!loaded) setLoaded(true);
    }, 200);
  }, [loaded]);

  const handleLeave = useCallback(() => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), 250);
  }, []);

  // Cleanup timers on unmount
  useEffect(
    () => () => {
      if (enterTimer.current) clearTimeout(enterTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={href}
        aria-label={label}
        className="flex items-center gap-1.5 text-sm text-[#666] hover:text-[#1a1a1a] px-3 py-2 hover:bg-[#faf9f7] transition-colors relative"
      >
        {icon}
        {!!badge && badge > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 ${badgeColor} text-white text-[10px] font-bold min-w-4.5 h-4.5 flex items-center justify-center rounded-full`}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Link>

      {/* Dropdown — close on any click inside (e.g. navigating to an item) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#e8e6e3] shadow-sm shadow-[#e8e6e3]/40 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {loaded && children({ load: () => {} })}
        </div>
      )}
    </div>
  );
}

// ─── Messages preview ─────────────────────────────────────────────────────────

type ConversationPreview = {
  id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  listings: { title: string; primary_image_url: string | null } | null;
  buyer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  seller: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function MessagesPreview() {
  const { userId } = useCurrentUser();
  const [convos, setConvos] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);
  const t = useTranslations("nav");

  useEffect(() => {
    if (!userId || fetched.current) return;
    fetched.current = true;
    const supabase = createClient();
    supabase
      .from("conversations")
      .select(
        `id, last_message_at, last_message_preview,
         listings(title, primary_image_url),
         buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url),
         seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)`,
      )
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(4)
      .then(({ data }) => {
        setConvos((data as unknown as ConversationPreview[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-[#f0eeeb] shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 w-24 bg-[#f0eeeb] rounded" />
              <div className="h-3 w-40 bg-[#f0eeeb] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (convos.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <MessageCircle className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
        <p className="text-sm text-[#bbb]">{t("noMessages")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-[#e8e6e3]">
        {convos.map((c) => {
          const other = c.buyer?.id === userId ? c.seller : c.buyer;
          return (
            <Link
              key={c.id}
              href={`/dashboard/messages/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#f0eeeb] flex items-center justify-center text-[#666] text-sm font-bold shrink-0 overflow-hidden">
                {other?.avatar_url ? (
                  <Image
                    src={other.avatar_url}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (other?.display_name || "U")[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a1a1a] truncate">
                  {other?.display_name || "User"}
                </p>
                <p className="text-xs text-[#999] truncate">
                  {c.last_message_preview || c.listings?.title || "…"}
                </p>
              </div>
              {c.last_message_at && (
                <span className="text-[10px] text-[#bbb] shrink-0">
                  {shortTimeAgo(c.last_message_at)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <Link
        href="/dashboard/messages"
        className="block text-center text-xs font-semibold text-[#666] hover:text-[#1a1a1a] py-2.5 border-t border-[#e8e6e3] hover:bg-[#faf9f7] transition-colors"
      >
        View all messages →
      </Link>
    </>
  );
}

// ─── Saved preview ────────────────────────────────────────────────────────────

type SavedListing = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  primary_image_url: string | null;
};

export function SavedPreview() {
  const { savedIds } = useSaved();
  const [items, setItems] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    const ids = Array.from(savedIds).slice(0, 4);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("listings")
      .select("id, slug, title, price, currency, primary_image_url")
      .in("id", ids)
      .limit(4)
      .then(({ data }) => {
        setItems((data as SavedListing[]) ?? []);
        setLoading(false);
      });
  }, [savedIds]);

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-12 h-10 bg-[#f0eeeb] shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 w-28 bg-[#f0eeeb] rounded" />
              <div className="h-3 w-16 bg-[#f0eeeb] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Heart className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
        <p className="text-sm text-[#bbb]">No saved listings yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-[#e8e6e3]">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/listing/${item.slug}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors"
          >
            <div className="w-12 h-10 bg-[#f0eeeb] shrink-0 overflow-hidden">
              {item.primary_image_url && (
                <Image
                  src={item.primary_image_url}
                  alt=""
                  width={48}
                  height={40}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1a1a] truncate">
                {item.title}
              </p>
              <p className="text-xs font-semibold text-[#666]">
                {item.price != null
                  ? `${item.currency === "EUR" ? "€" : item.currency}${item.price.toLocaleString()}`
                  : "Contact"}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/dashboard/saved"
        className="block text-center text-xs font-semibold text-[#666] hover:text-[#1a1a1a] py-2.5 border-t border-[#e8e6e3] hover:bg-[#faf9f7] transition-colors"
      >
        View all saved →
      </Link>
    </>
  );
}

// ─── Notifications preview ────────────────────────────────────────────────────

type NotificationPreview = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
};

const NOTIF_ICONS: Record<string, string> = {
  price_drop: "▼",
  offer_received: "◆",
  offer_accepted: "✓",
  offer_declined: "✕",
  offer_countered: "↻",
  new_message: "💬",
  saved_search_match: "◎",
  listing_expired: "⌛",
};

export function NotificationsPreview() {
  const { userId } = useCurrentUser();
  const [notifs, setNotifs] = useState<NotificationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fresh on every mount (component unmounts when dropdown closes)
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, type, title, body, read, link, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setNotifs((data as NotificationPreview[]) ?? []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#f0eeeb] shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 w-32 bg-[#f0eeeb] rounded" />
              <div className="h-3 w-48 bg-[#f0eeeb] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifs.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <span className="text-2xl block mb-2">🔔</span>
        <p className="text-sm text-[#bbb]">No notifications yet</p>
      </div>
    );
  }

  function handleClick(n: NotificationPreview) {
    if (!n.read) {
      // Mark as read in the database
      const supabase = createClient();
      supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", n.id)
        .then();
      // Update local state immediately
      setNotifs((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
      );
    }
  }

  return (
    <>
      <div className="divide-y divide-[#e8e6e3]">
        {notifs.map((n) => {
          const Wrapper = n.link ? Link : "div";
          const wrapperProps = n.link ? { href: n.link } : {};
          return (
            <Wrapper
              key={n.id}
              {...(wrapperProps as any)}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors cursor-pointer ${!n.read ? "bg-[#faf9f7]/40" : ""}`}
            >
              <span className="text-base shrink-0 mt-0.5">
                {NOTIF_ICONS[n.type] || "📋"}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${!n.read ? "font-semibold text-[#1a1a1a]" : "font-medium text-[#666]"}`}
                >
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-xs text-[#999] truncate">{n.body}</p>
                )}
                <p className="text-[10px] text-[#bbb] mt-0.5">
                  {shortTimeAgo(n.created_at)}
                </p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-[#666] shrink-0 mt-2" />
              )}
            </Wrapper>
          );
        })}
      </div>
      <div className="flex items-center border-t border-[#e8e6e3]">
        {notifs.some((n) => !n.read) && (
          <button
            onClick={() => {
              const supabase = createClient();
              const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
              supabase
                .from("notifications")
                .update({ read: true })
                .in("id", unreadIds)
                .then();
              setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            className="flex-1 text-center text-xs font-semibold text-green-600 hover:text-green-700 py-2.5 hover:bg-green-50/50 transition-colors flex items-center justify-center gap-1"
          >
            ✓ Mark all read
          </button>
        )}
        <Link
          href="/dashboard/notifications"
          className={`flex-1 block text-center text-xs font-semibold text-[#666] hover:text-[#1a1a1a] py-2.5 hover:bg-[#faf9f7] transition-colors ${notifs.some((n) => !n.read) ? "border-l border-[#e8e6e3]" : ""}`}
        >
          View all notifications →
        </Link>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
