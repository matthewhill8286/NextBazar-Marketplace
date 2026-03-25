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
import Link from "next/link";
import { useState } from "react";
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
  offer_received: <Tag className="w-4 h-4 text-indigo-600" />,
  offer_accepted: <Check className="w-4 h-4 text-green-600" />,
  offer_declined: <Tag className="w-4 h-4 text-red-500" />,
  offer_countered: <Tag className="w-4 h-4 text-amber-600" />,
  new_message: <MessageCircle className="w-4 h-4 text-indigo-600" />,
  saved_search_match: <Bell className="w-4 h-4 text-violet-600" />,
  listing_expired: <Bell className="w-4 h-4 text-red-500" />,
};

const TYPE_BG: Record<string, string> = {
  price_drop: "bg-green-50",
  offer_received: "bg-indigo-50",
  offer_accepted: "bg-green-50",
  offer_declined: "bg-red-50",
  offer_countered: "bg-amber-50",
  new_message: "bg-indigo-50",
  saved_search_match: "bg-violet-50",
  listing_expired: "bg-red-50",
};

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
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
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread.length > 0
              ? `${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>

        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No notifications yet
          </h3>
          <p className="text-gray-500 text-sm">
            You'll be notified here about price drops, offers, and messages.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {notifications.map((n) => {
            const icon = TYPE_ICON[n.type] ?? (
              <Bell className="w-4 h-4 text-gray-400" />
            );
            const bg = TYPE_BG[n.type] ?? "bg-gray-50";

            const inner = (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 transition-colors ${
                  !n.read ? "bg-indigo-50/30" : "hover:bg-gray-50/50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                    >
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
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
                      className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
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
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full shrink-0 mt-1.5" />
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
