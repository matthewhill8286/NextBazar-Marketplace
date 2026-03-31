"use client";

import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pin,
  PinOff,
  Send,
  Shield,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_pinned: boolean;
  deleted_at: string | null;
  message_type: "text" | "offer";
  offer_price: number | null;
  offer_status: "pending" | "accepted" | "declined" | null;
};

export default function ChatThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [sendError, setSendError] = useState(false);
  // Delete conversation dialog
  const [deleteConvOpen, setDeleteConvOpen] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);
  // Delete message dialog
  const [deleteMsg, setDeleteMsg] = useState<Message | null>(null);
  const [deletingMsg, setDeletingMsg] = useState(false);
  // Offer dialog
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);

  // Load conversation & messages
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

      const { data: conv } = await supabase
        .from("conversations")
        .select(
          `
          *,
          listings(id, title, slug, primary_image_url, price, currency),
          buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url, verified),
          seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url, verified)
        `,
        )
        .eq("id", conversationId)
        .single();

      if (!conv) {
        router.push("/dashboard/messages");
        return;
      }
      setConversation(conv);

      const { data: msgs } = await supabase
        .from("messages")
        .select(
          "id, sender_id, content, created_at, read_at, is_pinned, deleted_at, message_type, offer_price, offer_status",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .is("read_at", null);

      setLoading(false);
    }
    load();
  }, [conversationId]);

  // Subscribe to new messages in real-time
  useRealtimeTable<Message>({
    channelName: `chat-${conversationId}-insert`,
    table: "messages",
    event: "INSERT",
    filter: `conversation_id=eq.${conversationId}`,
    onPayload: ({ new: newMsg }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg as Message];
      });
      if (newMsg.sender_id !== userId) {
        supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("id", newMsg.id)
          .then();
      }
    },
    enabled: !!conversationId && !!userId,
  });

  // Subscribe to message updates (edits, pin, offer status) in real-time
  useRealtimeTable<Message>({
    channelName: `chat-${conversationId}-update`,
    table: "messages",
    event: "UPDATE",
    filter: `conversation_id=eq.${conversationId}`,
    onPayload: ({ new: updated }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === updated.id ? { ...m, ...(updated as Message) } : m,
        ),
      );
    },
    enabled: !!conversationId && !!userId,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close context menu on outside click
  useEffect(() => {
    function close() {
      setActiveMenu(null);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !userId || sending) return;
    setSending(true);

    const content = newMessage.trim();
    setNewMessage("");

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      is_pinned: false,
      deleted_at: null,
      message_type: "text",
      offer_price: null,
      offer_status: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    setSendError(false);
    const { data: inserted, error: insertErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        message_type: "text",
      })
      .select(
        "id, sender_id, content, created_at, read_at, is_pinned, deleted_at, message_type, offer_price, offer_status",
      )
      .single();

    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? inserted : m)),
      );
      // Update conversation preview
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content.slice(0, 100),
        })
        .eq("id", conversationId);
    } else {
      // Insert failed — remove optimistic message and surface the error
      console.error("Message send failed:", insertErr);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setNewMessage(content); // restore text
      setSendError(true);
    }

    setSending(false);
    inputRef.current?.focus();
  }, [newMessage, userId, sending, conversationId]);

  async function handlePin(msg: Message) {
    setActiveMenu(null);
    const next = !msg.is_pinned;
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: next } : m)),
    );
    await supabase
      .from("messages")
      .update({ is_pinned: next })
      .eq("id", msg.id);
  }

  async function handleDeleteConversation() {
    setDeletingConv(true);
    await supabase.from("conversations").delete().eq("id", conversationId);
    router.push("/dashboard/messages");
  }

  async function handleDeleteMessage() {
    if (!deleteMsg) return;
    setDeletingMsg(true);
    const now = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) => (m.id === deleteMsg.id ? { ...m, deleted_at: now } : m)),
    );
    await supabase
      .from("messages")
      .update({ deleted_at: now })
      .eq("id", deleteMsg.id);
    setDeletingMsg(false);
    setDeleteMsg(null);
  }

  async function handleSendOffer() {
    const price = parseFloat(offerPrice);
    if (!price || price <= 0 || !userId || !conversation) return;
    setSendingOffer(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      content: "",
      created_at: new Date().toISOString(),
      read_at: null,
      is_pinned: false,
      deleted_at: null,
      message_type: "offer",
      offer_price: price,
      offer_status: "pending",
    };
    setMessages((prev) => [...prev, optimistic]);
    setOfferOpen(false);
    setOfferPrice("");

    const { data: inserted } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: "",
        message_type: "offer",
        offer_price: price,
        offer_status: "pending",
      })
      .select(
        "id, sender_id, content, created_at, read_at, is_pinned, deleted_at, message_type, offer_price, offer_status",
      )
      .single();

    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? inserted : m)),
      );

      // Also create a row in the offers table so it shows in the Offers tab
      const listingCurrency = conversation.listings?.currency || "EUR";
      await supabase.from("offers").insert({
        listing_id: conversation.listing_id,
        buyer_id: userId,
        seller_id:
          userId === conversation.buyer_id
            ? conversation.seller_id
            : conversation.buyer_id,
        amount: price,
        currency: listingCurrency,
        message: null,
      });

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: `💰 Offer: €${price.toLocaleString()}`,
        })
        .eq("id", conversationId);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
    setSendingOffer(false);
  }

  async function handleOfferResponse(
    msg: Message,
    status: "accepted" | "declined",
  ) {
    // Optimistic
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, offer_status: status } : m)),
    );
    await supabase
      .from("messages")
      .update({ offer_status: status })
      .eq("id", msg.id);

    // Sync the corresponding row in the offers table
    if (conversation && msg.offer_price) {
      const buyerId =
        msg.sender_id === conversation.buyer_id
          ? conversation.buyer_id
          : conversation.seller_id;
      await supabase
        .from("offers")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("listing_id", conversation.listing_id)
        .eq("buyer_id", buyerId)
        .eq("amount", msg.offer_price)
        .eq("status", "pending");
    }

    // Send a follow-up text message
    const reply =
      status === "accepted"
        ? `✅ Offer of €${msg.offer_price?.toLocaleString()} accepted!`
        : `❌ Offer of €${msg.offer_price?.toLocaleString()} declined.`;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: reply,
      message_type: "text",
    });
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: reply,
      })
      .eq("id", conversationId);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(d: string) {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#8E7A6B] animate-spin" />
      </div>
    );
  }

  if (!conversation) return null;

  const otherUser =
    conversation.buyer_id === userId ? conversation.seller : conversation.buyer;
  const listing = conversation.listings;

  const initials =
    otherUser?.display_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const pinnedMessages = messages.filter((m) => m.is_pinned && !m.deleted_at);

  let lastDate = "";

  return (
    <div
      className="mx-auto flex flex-col"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-[#e8e6e3] px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard/messages"
          aria-label="Back to messages"
          className="p-1.5 hover:bg-[#f0eeeb] transition-colors text-[#6b6560]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 bg-gradient-to-br from-[#8E7A6B] to-[#7A6657] rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
          {otherUser?.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt=""
              width={40}
              height={40}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#1a1a1a] text-sm truncate">
              {otherUser?.display_name || "User"}
            </span>
            {otherUser?.verified && (
              <Shield className="w-3.5 h-3.5 text-[#8E7A6B]" />
            )}
          </div>
          {listing?.title && (
            <Link
              href={`/listing/${listing.slug}`}
              className="text-xs text-[#8E7A6B] hover:underline truncate block"
            >
              {listing.title}
            </Link>
          )}
        </div>
        {listing?.primary_image_url && (
          <Link
            href={`/listing/${listing.slug}`}
            className="w-10 h-10 overflow-hidden bg-[#f0eeeb] shrink-0 relative hover:opacity-80 transition-opacity"
          >
            <Image
              src={listing.primary_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          </Link>
        )}
        <button
          onClick={() => setDeleteConvOpen(true)}
          title="Delete conversation"
          className="p-1.5 hover:bg-red-50 text-[#8a8280] hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Listing info bar */}
      {listing && (
        <div className="bg-[#f0eeeb] border-b border-[#e8e6e3] px-4 py-2.5 flex items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#7A6657] font-medium truncate">
              {listing.title}
            </p>
            <p className="text-xs text-[#8E7A6B]">
              {listing.price
                ? `${listing.currency === "EUR" ? "€" : listing.currency}${listing.price.toLocaleString()}`
                : "Contact for price"}
            </p>
          </div>
          <Link
            href={`/listing/${listing.slug}`}
            className="text-xs text-[#8E7A6B] font-medium hover:underline flex items-center gap-1 shrink-0"
          >
            View <ExternalLink className="w-3 h-3" />
          </Link>
          {conversation.seller_id !== userId && (
            <button
              onClick={() => setOfferOpen(true)}
              className="text-xs bg-[#8E7A6B] text-white px-3 py-1.5 font-medium hover:bg-[#7A6657] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Tag className="w-3 h-3" /> Make Offer
            </button>
          )}
        </div>
      )}

      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 shrink-0">
          <button
            onClick={() => setPinnedExpanded((v) => !v)}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-xs font-semibold text-amber-800">
                {pinnedMessages.length} pinned{" "}
                {pinnedMessages.length === 1 ? "message" : "messages"}
              </span>
              <span className="text-xs text-amber-600 ml-auto">
                {pinnedExpanded ? "Hide" : "Show"}
              </span>
            </div>
            {pinnedExpanded && (
              <div className="mt-2 space-y-1.5">
                {pinnedMessages.map((pm) => (
                  <div
                    key={pm.id}
                    className="bg-white px-3 py-2 border border-amber-100 text-xs text-[#666] line-clamp-2"
                  >
                    {pm.content}
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-[#8a8280] text-sm">
            Start the conversation by sending a message
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          const isDeleted = !!msg.deleted_at;
          const msgDate = formatDate(msg.created_at);
          let showDate = false;
          if (msgDate !== lastDate) {
            showDate = true;
            lastDate = msgDate;
          }

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] text-[#8a8280] bg-[#f0eeeb] px-3 py-1 rounded-full font-medium">
                    {msgDate}
                  </span>
                </div>
              )}

              {/* Pinned indicator */}
              {msg.is_pinned && !isDeleted && (
                <div
                  className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5`}
                >
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                </div>
              )}

              <div
                className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group`}
              >
                {/* Actions menu — appears on hover */}
                {!isDeleted && (
                  <div
                    className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "order-first mr-1.5" : "order-last ml-1.5"}`}
                  >
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === msg.id ? null : msg.id);
                        }}
                        className="p-1 rounded-full bg-[#f0eeeb] hover:bg-[#f0eeeb] text-[#6b6560] transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {activeMenu === msg.id && (
                        <div
                          className={`absolute bottom-full mb-1 z-20 bg-white border border-[#e8e6e3] shadow-sm py-1 min-w-[140px] ${isMe ? "right-0" : "left-0"}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handlePin(msg)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#666] hover:bg-[#faf9f7] transition-colors"
                          >
                            {msg.is_pinned ? (
                              <>
                                <PinOff className="w-3.5 h-3.5 text-amber-500" />{" "}
                                Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="w-3.5 h-3.5 text-amber-500" />{" "}
                                Pin message
                              </>
                            )}
                          </button>
                          {isMe && (
                            <button
                              onClick={() => {
                                setActiveMenu(null);
                                setDeleteMsg(msg);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Offer card */}
                {msg.message_type === "offer" && !isDeleted ? (
                  <div
                    className={`max-w-[75%] border overflow-hidden ${
                      isMe ? "rounded-br-md" : "rounded-bl-md"
                    } ${msg.is_pinned ? "ring-2 ring-amber-400 ring-offset-1" : ""} ${
                      msg.offer_status === "accepted"
                        ? "border-green-200"
                        : msg.offer_status === "declined"
                          ? "border-red-200"
                          : "border-[#e8e6e3]"
                    } bg-white`}
                  >
                    <div
                      className={`px-4 py-2 flex items-center gap-2 text-xs font-semibold ${
                        msg.offer_status === "accepted"
                          ? "bg-green-50 text-green-700"
                          : msg.offer_status === "declined"
                            ? "bg-red-50 text-red-600"
                            : "bg-[#f0eeeb] text-[#7A6657]"
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {msg.offer_status === "accepted"
                        ? "Offer Accepted"
                        : msg.offer_status === "declined"
                          ? "Offer Declined"
                          : "Price Offer"}
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-2xl font-bold text-[#1a1a1a]">
                        €{msg.offer_price?.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#8a8280] mt-0.5">
                        Non-binding offer
                      </p>

                      {/* Accept / Decline for seller when pending */}
                      {!isMe && msg.offer_status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleOfferResponse(msg, "accepted")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleOfferResponse(msg, "declined")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}
                      {msg.offer_status === "pending" && isMe && (
                        <p className="text-xs text-[#8E7A6B] mt-2 font-medium">
                          Awaiting response…
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8a8280] px-4 pb-2">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                      isDeleted
                        ? "bg-[#f0eeeb] text-[#8a8280] italic border border-[#e8e6e3]"
                        : isMe
                          ? `bg-[#8E7A6B] text-white rounded-br-md ${msg.is_pinned ? "ring-2 ring-amber-400 ring-offset-1" : ""}`
                          : `bg-white border border-[#e8e6e3] text-[#1a1a1a] rounded-bl-md ${msg.is_pinned ? "ring-2 ring-amber-400 ring-offset-1" : ""}`
                    }`}
                  >
                    {isDeleted ? (
                      <p className="flex items-center gap-1.5">
                        <X className="w-3 h-3" /> Message deleted
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {!isDeleted && (
                      <p
                        className={`text-[10px] mt-1 ${isMe ? "text-[#8E7A6B]/50" : "text-[#8a8280]"}`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Send error banner */}
      {sendError && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-xs text-red-600">
            Message failed to send. Please try again.
          </span>
          <button
            onClick={() => setSendError(false)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-[#e8e6e3] px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            aria-label="Type a message"
            className="flex-1 px-4 py-2.5 border border-[#e8e6e3] bg-[#faf9f7] focus:bg-white focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm resize-none max-h-32"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            aria-label="Send message"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-[#8E7A6B] text-white hover:bg-[#7A6657] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      {/* Modals */}
      {/* Delete Conversation Modal */}
      {deleteConvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConvOpen(false)}
          />
          <div className="relative bg-white p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">
              Delete conversation?
            </h3>
            <p className="text-sm text-[#6b6560] mb-6">
              This will permanently delete this conversation and all its
              messages for you. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConvOpen(false)}
                className="flex-1 px-4 py-2.5 border border-[#e8e6e3] text-sm font-semibold text-[#666] hover:bg-[#faf9f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={deletingConv}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deletingConv ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {deleteMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteMsg(null)}
          />
          <div className="relative bg-white p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">
              Delete message?
            </h3>
            <p className="text-sm text-[#6b6560] mb-6">
              Are you sure you want to delete this message?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteMsg(null)}
                className="flex-1 px-4 py-2.5 border border-[#e8e6e3] text-sm font-semibold text-[#666] hover:bg-[#faf9f7] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                disabled={deletingMsg}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deletingMsg ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Offer Modal */}
      {offerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOfferOpen(false)}
          />
          <div className="relative bg-white p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1a1a1a]">
                Make an offer
              </h3>
              <button
                onClick={() => setOfferOpen(false)}
                className="p-1 hover:bg-[#f0eeeb] transition-colors"
              >
                <X className="w-5 h-5 text-[#8a8280]" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#6b6560] uppercase tracking-wider mb-2">
                Your Price Offer
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8280] font-semibold">
                  €
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none font-semibold text-lg"
                />
              </div>
              <p className="mt-2 text-[11px] text-[#8a8280]">
                Enter a fair price for this item. Offers are non-binding but
                show serious interest.
              </p>
            </div>

            <button
              onClick={handleSendOffer}
              disabled={
                sendingOffer || !offerPrice || parseFloat(offerPrice) <= 0
              }
              className="w-full py-3 bg-[#8E7A6B] text-white font-bold hover:bg-[#7A6657] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendingOffer ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Tag className="w-4 h-4" /> Send Offer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
