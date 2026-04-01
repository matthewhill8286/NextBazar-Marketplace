"use client";

import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Tag,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { timeAgo } from "@/lib/format-helpers";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  listing_id: string | null;
  offer_id: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  price_drop: <TrendingDown className="w-4 h-4 text-green-600" />,
  offer_received: <Tag className="w-4 h-4 text-[#8E7A6B]" />,
  offer_accepted: <Check className="w-4 h-4 text-green-600" />,
  offer_declined: <Tag className="w-4 h-4 text-red-500" />,
  offer_countered: <Tag className="w-4 h-4 text-amber-600" />,
  new_message: <MessageCircle className="w-4 h-4 text-[#8E7A6B]" />,
  saved_search_match: <Bell className="w-4 h-4 text-[#8E7A6B]" />,
  listing_expired: <Bell className="w-4 h-4 text-red-500" />,
};

const TYPE_BG: Record<string, string> = {
  price_drop: "bg-green-50",
  offer_received: "bg-[#f0eeeb]",
  offer_accepted: "bg-green-50",
  offer_declined: "bg-red-50",
  offer_countered: "bg-amber-50",
  new_message: "bg-[#f0eeeb]",
  saved_search_match: "bg-[#f0eeeb]",
  listing_expired: "bg-red-50",
};

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const t = useTranslations("dashboard.notifications");
  const supabase = createClient();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifications.filter((n) => !n.read);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  async function markAllRead() {
    setMarkingAll(true);
    const ids = unread.map((n) => n.id);
    if (ids.length) {
      await supabase.from("notifications").update({ read: true }).in("id", ids);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setMarkingAll(false);
  }

  async function deleteNotif(id: string) {
    // Use server API route to bypass RLS restrictions
    const res = await fetch("/api/notifications/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{t("title")}</h1>
          <p className="text-sm text-[#6b6560] mt-0.5">
            {unread.length > 0
              ? t("unread", { count: unread.length })
              : t("allCaughtUp")}
          </p>
        </div>

        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 text-sm font-medium text-[#8E7A6B] hover:text-[#7A6657] disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            {t("markAllRead")}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-[#e8e6e3] p-16 text-center">
          <div className="w-14 h-14 bg-[#faf9f7] rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-[#8a8280]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">
            {t("empty")}
          </h3>
          <p className="text-[#6b6560] text-sm">{t("emptyDesc")}</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7] overflow-hidden">
          {notifications.map((n) => {
            const icon = TYPE_ICON[n.type] ?? (
              <Bell className="w-4 h-4 text-[#8a8280]" />
            );
            const bg = TYPE_BG[n.type] ?? "bg-[#faf9f7]";

            const inner = (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 transition-colors ${
                  !n.read ? "bg-[#f0eeeb]/30" : "hover:bg-[#faf9f7]/50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 ${bg} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${!n.read ? "font-semibold text-[#1a1a1a]" : "font-medium text-[#666]"}`}
                    >
                      {n.title}
                    </p>
                    <span className="text-xs text-[#8a8280] shrink-0 mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-sm text-[#6b6560] mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                      className="p-1.5 text-[#8a8280] hover:text-[#8E7A6B] hover:bg-[#f0eeeb] transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteNotif(n.id);
                    }}
                    className="p-1.5 text-[#8a8280] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 bg-[#8E7A6B] rounded-full shrink-0 mt-1.5" />
                )}
              </div>
            );

            return n.link ? (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => !n.read && markRead(n.id)}
                className="block"
              >
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
