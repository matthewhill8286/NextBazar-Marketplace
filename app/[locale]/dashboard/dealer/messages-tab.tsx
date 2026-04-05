"use client";

import { Clock, Loader2, MessageCircle, Pin, Search } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { ConversationRow } from "./types";

export default function MessagesTab({
  shopMode = false,
}: {
  shopMode?: boolean;
}) {
  const { userId } = useAuth();
  const supabase = createClient();

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ─── Load conversations ───────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("conversations")
      .select(
        `*, listing:listings(id, title, slug, primary_image_url), buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url)`,
      )
      .eq("seller_id", userId)
      .order("last_message_at", { ascending: false });

    if (data) setConversations(data as unknown as ConversationRow[]);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ─── Filter ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.listing?.title?.toLowerCase().includes(q) ||
        c.buyer?.display_name?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const unreadCount = conversations.reduce((s, c) => s + c.seller_unread, 0);
  const pinnedCount = conversations.filter((c) => c.is_pinned).length;

  // ─── Group: pinned first, then sorted by recency ──────────────────────
  const grouped = useMemo(() => {
    const pinned = filtered.filter((c) => c.is_pinned);
    const unpinned = filtered.filter((c) => !c.is_pinned);
    return { pinned, unpinned };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#8a8280]" />
      </div>
    );
  }

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">
          Messages
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-bold bg-[#8E7A6B] text-white px-2 py-0.5">
              {unreadCount} unread
            </span>
          )}
        </h3>
        <Link
          href={shopMode ? "/dashboard/messages" : "/dashboard/messages"}
          className="text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657] transition-colors"
        >
          {shopMode ? "View all" : "Open full inbox"} &rarr;
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8280]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#e8e6e3] bg-white focus:outline-none focus:ring-2 focus:ring-[#8E7A6B]/20 focus:border-[#8E7A6B]"
        />
      </div>

      {/* Conversation list */}
      <div className="bg-white border border-[#e8e6e3] overflow-hidden divide-y divide-[#faf9f7]">
        {/* Pinned section */}
        {grouped.pinned.length > 0 && (
          <>
            <div className="px-4 py-2 bg-[#faf9f7] border-b border-[#e8e6e3]">
              <span className="text-[10px] font-semibold text-[#8a8280] uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3" />
                Pinned ({pinnedCount})
              </span>
            </div>
            {grouped.pinned.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                timeAgo={timeAgo}
                shopMode={shopMode}
              />
            ))}
          </>
        )}

        {/* Recent */}
        {grouped.unpinned.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            timeAgo={timeAgo}
            shopMode={shopMode}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#8a8280]">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#8a8280]" />
            <p className="font-medium">No conversations</p>
            <p className="text-xs mt-1 text-[#6b6560]">
              {search
                ? "No conversations match your search"
                : "Messages from buyers will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Conversation row ──────────────────────────────────────────────────── */
function ConversationItem({
  conversation: c,
  timeAgo,
  shopMode = false,
}: {
  conversation: ConversationRow;
  timeAgo: (d: string | null) => string;
  shopMode?: boolean;
}) {
  return (
    <Link
      href={
        shopMode ? `/dashboard/messages/${c.id}` : `/dashboard/messages/${c.id}`
      }
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#faf9f7] transition-colors group"
    >
      {/* Buyer avatar */}
      <div className="w-10 h-10 bg-[#f0eeeb] overflow-hidden shrink-0 relative flex items-center justify-center">
        {c.buyer?.avatar_url ? (
          <Image
            src={c.buyer.avatar_url}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <span className="text-sm font-semibold text-[#8a8280]">
            {(c.buyer?.display_name ?? "?")[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${c.seller_unread > 0 ? "font-bold text-[#1a1a1a]" : "font-medium text-[#1a1a1a]"}`}
          >
            {c.buyer?.display_name ?? "Anonymous"}
          </span>
          <span className="text-[10px] text-[#8a8280] shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(c.last_message_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {c.listing && (
            <span className="text-[10px] font-medium text-[#8E7A6B] bg-[#f0eeeb] px-1.5 py-0.5 truncate max-w-[120px]">
              {c.listing.title}
            </span>
          )}
          <p
            className={`text-xs truncate ${c.seller_unread > 0 ? "text-[#1a1a1a] font-medium" : "text-[#6b6560]"}`}
          >
            {c.last_message_preview ?? "No messages yet"}
          </p>
        </div>
      </div>

      {/* Unread badge */}
      {c.seller_unread > 0 && (
        <div className="w-5 h-5 bg-[#8E7A6B] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {c.seller_unread > 9 ? "9+" : c.seller_unread}
        </div>
      )}
    </Link>
  );
}
