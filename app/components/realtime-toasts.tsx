"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, Tag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Custom toast UIs ────────────────────────────────────────────────────────

function MessageToast({
  toastId,
  senderName,
  avatarUrl,
  listingTitle,
  preview,
  isOffer,
  onNavigate,
}: {
  toastId: string | number;
  senderName: string;
  avatarUrl: string | null;
  listingTitle: string;
  preview: string;
  isOffer: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="w-[340px] bg-white rounded-2xl shadow-2xl shadow-blue-100/60 border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-gradient-to-b from-blue-500 to-indigo-600 shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={senderName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                {isOffer ? "In-chat offer" : "New message"}
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">{senderName}</p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-gray-400 truncate mb-1.5">
          Re: {listingTitle}
        </p>

        {preview && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
            &ldquo;{preview}&rdquo;
          </p>
        )}

        <button
          onClick={onNavigate}
          className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl py-1.5 transition-colors"
        >
          View conversation →
        </button>
      </div>
    </div>
  );
}

function OfferToast({
  toastId,
  buyerName,
  avatarUrl,
  listingTitle,
  amount,
  onNavigate,
}: {
  toastId: string | number;
  buyerName: string;
  avatarUrl: string | null;
  listingTitle: string;
  amount: string;
  onNavigate: () => void;
}) {
  return (
    <div className="w-[340px] bg-white rounded-2xl shadow-2xl shadow-emerald-100/60 border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-gradient-to-b from-emerald-500 to-teal-600 shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={buyerName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                New offer received
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">{buyerName}</p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-gray-400 truncate mb-1.5">{listingTitle}</p>

        <div className="flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl py-2 mb-3">
          <span className="text-xl font-extrabold text-emerald-600">{amount}</span>
        </div>

        <button
          onClick={onNavigate}
          className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl py-1.5 transition-colors"
        >
          Review offer →
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RealtimeToasts() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // Keep a ref to always have the current pathname inside async callbacks
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    const channels: ReturnType<typeof supabase.channel>[] = [];

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const userId = user.id;

      // ── New message subscription ─────────────────────────────────────────
      // RLS ensures only messages in the user's conversations are delivered
      const msgChannel = supabase
        .channel("rt-new-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async (payload) => {
            const msg = payload.new as any;

            // Ignore own messages
            if (msg.sender_id === userId) return;

            // Suppress if already viewing that conversation
            if (pathnameRef.current.includes(`/messages/${msg.conversation_id}`)) return;

            // Fetch sender profile + conversation/listing title in parallel
            const [{ data: sender }, { data: conv }] = await Promise.all([
              supabase
                .from("profiles")
                .select("display_name, avatar_url")
                .eq("id", msg.sender_id)
                .single(),
              supabase
                .from("conversations")
                .select("listings(title)")
                .eq("id", msg.conversation_id)
                .single(),
            ]);

            const senderName = sender?.display_name || "Someone";
            const listingTitle = (conv?.listings as any)?.title || "a listing";
            const isOffer = msg.message_type === "offer";
            const preview = isOffer
              ? `Offered €${Number(msg.offer_price).toLocaleString()}`
              : (msg.content || "").slice(0, 100);

            toast.custom(
              (t) => (
                <MessageToast
                  toastId={t}
                  senderName={senderName}
                  avatarUrl={sender?.avatar_url ?? null}
                  listingTitle={listingTitle}
                  preview={preview}
                  isOffer={isOffer}
                  onNavigate={() => {
                    toast.dismiss(t);
                    router.push(`/messages/${msg.conversation_id}`);
                  }}
                />
              ),
              { duration: 7000, position: "top-right" },
            );
          },
        )
        .subscribe();

      // ── New offer subscription ───────────────────────────────────────────
      const offerChannel = supabase
        .channel("rt-new-offers")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "offers",
            filter: `seller_id=eq.${userId}`,
          },
          async (payload) => {
            const offer = payload.new as any;

            // Fetch buyer profile + listing title in parallel
            const [{ data: buyer }, { data: listing }] = await Promise.all([
              supabase
                .from("profiles")
                .select("display_name, avatar_url")
                .eq("id", offer.buyer_id)
                .single(),
              supabase
                .from("listings")
                .select("title")
                .eq("id", offer.listing_id)
                .single(),
            ]);

            const buyerName = buyer?.display_name || "Someone";
            const listingTitle = listing?.title || "your listing";
            const sym = offer.currency === "EUR" ? "€" : (offer.currency ?? "€");
            const amount = `${sym}${Number(offer.amount).toLocaleString()}`;

            toast.custom(
              (t) => (
                <OfferToast
                  toastId={t}
                  buyerName={buyerName}
                  avatarUrl={buyer?.avatar_url ?? null}
                  listingTitle={listingTitle}
                  amount={amount}
                  onNavigate={() => {
                    toast.dismiss(t);
                    router.push(`/dashboard/offers?offer=${offer.id}`);
                  }}
                />
              ),
              { duration: 10000, position: "top-right" },
            );
          },
        )
        .subscribe();

      channels.push(msgChannel, offerChannel);
    }

    setup();

    return () => {
      mounted = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
