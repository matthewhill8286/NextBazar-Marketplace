"use client";

import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PinOff,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { timeAgoCompact } from "@/lib/format-helpers";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { createClient } from "@/lib/supabase/client";
import QuickReplyManager from "./quick-reply-manager";

type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  is_pinned: boolean;
  listings: {
    id: string;
    title: string;
    slug: string;
    primary_image_url: string | null;
  } | null;
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

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sellerTier, setSellerTier] = useState<string | null>(null);
  const [hasShop, setHasShop] = useState(false);

  const loadConversations = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from("conversations")
        .select(
          `
        id, buyer_id, seller_id, last_message_at, last_message_preview, is_pinned,
        listings(id, title, slug, primary_image_url),
        buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url),
        seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)
      `,
        )
        .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
        .order("is_pinned", { ascending: false })
        .order("last_message_at", { ascending: false, nullsFirst: false });

      setConversations((data as unknown as Conversation[]) || []);
    },
    [supabase],
  );

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?redirect=/dashboard/messages");
        return;
      }
      setUserId(user.id);
      await loadConversations(user.id);

      // Check if user has a shop
      const { data: shop } = await supabase
        .from("dealer_shops")
        .select("plan_tier")
        .eq("user_id", user.id)
        .eq("plan_status", "active")
        .single();
      if (shop?.plan_tier) {
        setSellerTier(shop.plan_tier);
        setHasShop(true);
      }

      setLoading(false);
    }
    load();
  }, []);

  // Realtime: refresh list when any conversation the user is part of changes
  useRealtimeTable({
    channelName: `conv-buyer-${userId ?? "anon"}`,
    table: "conversations",
    event: "*",
    filter: userId ? `buyer_id=eq.${userId}` : undefined,
    onPayload: () => {
      if (userId) loadConversations(userId);
    },
    enabled: !!userId,
  });
  useRealtimeTable({
    channelName: `conv-seller-${userId ?? "anon"}`,
    table: "conversations",
    event: "*",
    filter: userId ? `seller_id=eq.${userId}` : undefined,
    onPayload: () => {
      if (userId) loadConversations(userId);
    },
    enabled: !!userId,
  });

  async function handlePin(conv: Conversation, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    const next = !conv.is_pinned;
    // Optimistic
    setConversations((prev) =>
      prev
        .map((c) => (c.id === conv.id ? { ...c, is_pinned: next } : c))
        .sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          const aT = a.last_message_at
            ? new Date(a.last_message_at).getTime()
            : 0;
          const bT = b.last_message_at
            ? new Date(b.last_message_at).getTime()
            : 0;
          return bT - aT;
        }),
    );
    await supabase
      .from("conversations")
      .update({ is_pinned: next })
      .eq("id", conv.id);
  }

  async function handleDelete(conv: Conversation, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(null);
    setDeleteTarget(conv);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    await supabase.from("conversations").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const otherUser = c.buyer_id === userId ? c.seller : c.buyer;
    return (
      otherUser?.display_name?.toLowerCase().includes(q) ||
      c.listings?.title?.toLowerCase().includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="mx-auto px-4 py-6">
        <div className="h-7 w-32 bg-[#e8e6e3] animate-pulse mb-6" />
        <div className="h-10 w-full bg-[#e8e6e3] animate-pulse mb-4" />
        <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 p-4">
              <div className="w-12 h-12 rounded-full bg-[#e8e6e3] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-[#e8e6e3] animate-pulse" />
                  <div className="h-3 w-10 bg-[#e8e6e3] animate-pulse" />
                </div>
                <div className="h-3 w-48 bg-[#e8e6e3] animate-pulse" />
                <div className="h-3 w-36 bg-[#e8e6e3] animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-[#e8e6e3] animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">Messages</h1>

      {conversations.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8280]" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 border border-[#e8e6e3] bg-white text-sm outline-none focus-visible:border-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Shop messages banner */}
      {hasShop && (
        <Link
          href="/shop-manager/messages"
          className="flex items-center justify-between gap-3 mb-4 px-4 py-3 bg-[#f5f0eb] border border-[#e0d6cc] hover:bg-[#ede7df] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-[#8E7A6B]" />
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">
                Shop Messages
              </p>
              <p className="text-xs text-[#6b6560]">
                Manage buyer enquiries from your shop manager
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8E7A6B] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {filtered.length > 0 ? (
        <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7]">
          {filtered.map((conv) => {
            const otherUser =
              conv.buyer_id === userId ? conv.seller : conv.buyer;
            const initials =
              otherUser?.display_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";
            const menuOpen = activeMenu === conv.id;

            return (
              <div
                key={conv.id}
                className="relative group flex items-center hover:bg-[#faf9f7] transition-colors"
              >
                {/* Pin indicator strip */}
                {conv.is_pinned && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-l" />
                )}

                <Link
                  href={`/dashboard/messages/${conv.id}`}
                  className="flex items-center gap-3.5 p-4 flex-1 min-w-0"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-[#bbb] to-[#faf9f7]0 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {otherUser?.avatar_url ? (
                      <Image
                        src={otherUser.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#1a1a1a] text-sm truncate">
                          {otherUser?.display_name || "User"}
                        </span>
                        {conv.is_pinned && (
                          <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-[#8a8280] shrink-0 ml-2">
                        {timeAgoCompact(conv.last_message_at)}
                      </span>
                    </div>
                    {conv.listings?.title && (
                      <p className="text-xs text-[#666] truncate mb-0.5">
                        Re: {conv.listings.title}
                      </p>
                    )}
                    <p className="text-sm text-[#6b6560] truncate">
                      {conv.last_message_preview || "No messages yet"}
                    </p>
                  </div>

                  {/* Listing thumbnail */}
                  {conv.listings?.primary_image_url && (
                    <div className="w-10 h-10 overflow-hidden bg-[#f0eeeb] shrink-0 relative">
                      <Image
                        src={conv.listings.primary_image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  )}
                </Link>

                {/* ⋯ Actions menu — flex sibling, right of thumbnail */}
                <div className="pr-3 shrink-0 relative">
                  <button
                    onClick={() => setActiveMenu(menuOpen ? null : conv.id)}
                    className="p-1.5 bg-white border border-[#e8e6e3] shadow-sm hover:bg-[#faf9f7] text-[#6b6560] transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {menuOpen && (
                    <>
                      {/* Backdrop — closes menu when clicking anywhere outside */}
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setActiveMenu(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#e8e6e3] shadow-sm py-1 min-w-[160px]">
                        <button
                          onClick={(e) => handlePin(conv, e)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#666] hover:bg-[#faf9f7] transition-colors"
                        >
                          {conv.is_pinned ? (
                            <>
                              <PinOff className="w-3.5 h-3.5 text-amber-500" />{" "}
                              Unpin conversation
                            </>
                          ) : (
                            <>
                              <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin
                              conversation
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv, e)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete conversation
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-[#e8e6e3]">
          <MessageCircle className="w-12 h-12 text-[#8a8280] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-1">
            No messages yet
          </h2>
          <p className="text-sm text-[#6b6560] mb-4">
            When you contact a seller or someone messages you, it&apos;ll appear
            here
          </p>
          <Link
            href="/search"
            className="inline-flex bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-7 py-3 hover:bg-[#7A6657] transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          {/* Modal */}
          <div className="relative bg-white shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-1">
              Delete conversation?
            </h2>
            <p className="text-sm text-[#6b6560] mb-6">
              This will permanently remove the conversation with{" "}
              <span className="font-medium text-[#666]">
                {(deleteTarget.buyer_id === userId
                  ? deleteTarget.seller
                  : deleteTarget.buyer
                )?.display_name || "this user"}
              </span>
              . This cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-[#e8e6e3] text-sm font-medium text-[#666] hover:bg-[#faf9f7] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
