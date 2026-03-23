"use client";

import { Bell, MessageCircle, Tag, TrendingDown, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

// ─── Custom toast UIs ────────────────────────────────────────────────────────

function CounterOfferToast({
  toastId,
  sellerName,
  avatarUrl,
  listingTitle,
  counterAmount,
  onNavigate,
}: {
  toastId: string | number;
  sellerName: string;
  avatarUrl: string | null;
  listingTitle: string;
  counterAmount: string;
  onNavigate: () => void;
}) {
  return (
    <div className="w-85 bg-white rounded-2xl shadow-2xl shadow-indigo-100/60 border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-linear-to-b from-indigo-500 to-violet-600 shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <Image
                src={avatarUrl}
                alt={sellerName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                Counter offer received
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {sellerName}
              </p>
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
          {listingTitle}
        </p>

        <div className="flex items-center justify-center bg-indigo-50 border border-indigo-100 rounded-xl py-2 mb-3">
          <span className="text-xl font-extrabold text-indigo-600">
            {counterAmount}
          </span>
        </div>

        <button
          onClick={onNavigate}
          className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-1.5 transition-colors"
        >
          Review counter →
        </button>
      </div>
    </div>
  );
}

function OfferStatusToast({
  toastId,
  status,
  personName,
  avatarUrl,
  listingTitle,
  onNavigate,
}: {
  toastId: string | number;
  status: "accepted" | "declined";
  personName: string;
  avatarUrl: string | null;
  listingTitle: string;
  onNavigate: () => void;
}) {
  const isAccepted = status === "accepted";
  return (
    <div className={`w-85 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300 ${isAccepted ? "shadow-emerald-100/60" : "shadow-rose-100/60"}`}>
      <div className={`w-1 shrink-0 ${isAccepted ? "bg-linear-to-b from-emerald-500 to-teal-600" : "bg-linear-to-b from-rose-500 to-red-600"}`} />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={personName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAccepted ? "bg-emerald-100" : "bg-rose-100"}`}>
                <Tag className={`w-4 h-4 ${isAccepted ? "text-emerald-600" : "text-rose-600"}`} />
              </div>
            )}
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isAccepted ? "text-emerald-500" : "text-rose-500"}`}>
                Offer {isAccepted ? "accepted" : "declined"}
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {personName}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-gray-400 truncate mb-3">
          {listingTitle}
        </p>

        <button
          onClick={onNavigate}
          className={`w-full text-center text-xs font-semibold rounded-xl py-1.5 transition-colors ${isAccepted ? "text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100"}`}
        >
          View offer →
        </button>
      </div>
    </div>
  );
}

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
    <div className="w-85 bg-white rounded-2xl shadow-2xl shadow-indigo-100/60 border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-linear-to-b from-indigo-500 to-indigo-600 shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={senderName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                {isOffer ? "In-chat offer" : "New message"}
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {senderName}
              </p>
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
          className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-1.5 transition-colors"
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
    <div className="w-85 bg-white rounded-2xl shadow-2xl shadow-emerald-100/60 border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-linear-to-b from-emerald-500 to-teal-600 shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <Image
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
              <p className="text-sm font-bold text-gray-900 truncate">
                {buyerName}
              </p>
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
          {listingTitle}
        </p>

        <div className="flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl py-2 mb-3">
          <span className="text-xl font-extrabold text-emerald-600">
            {amount}
          </span>
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

// ─── Notification type config ────────────────────────────────────────────────

const NOTIF_CONFIG: Record<
  string,
  { accent: string; iconBg: string; icon: React.ReactNode; label: string }
> = {
  price_drop: {
    accent: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100",
    icon: <TrendingDown className="w-4 h-4 text-emerald-600" />,
    label: "Price drop",
  },
  saved_search_match: {
    accent: "from-violet-500 to-indigo-600",
    iconBg: "bg-violet-100",
    icon: <Bell className="w-4 h-4 text-violet-600" />,
    label: "New match",
  },
  listing_expired: {
    accent: "from-rose-500 to-red-600",
    iconBg: "bg-rose-100",
    icon: <Bell className="w-4 h-4 text-rose-600" />,
    label: "Listing expired",
  },
};

const NOTIF_DEFAULT = {
  accent: "from-indigo-500 to-indigo-600",
  iconBg: "bg-indigo-100",
  icon: <Bell className="w-4 h-4 text-indigo-600" />,
  label: "Notification",
};

function NotificationToast({
  toastId,
  type,
  title,
  body,
  onNavigate,
}: {
  toastId: string | number;
  type: string;
  title: string;
  body: string | null;
  onNavigate: () => void;
}) {
  const cfg = NOTIF_CONFIG[type] ?? NOTIF_DEFAULT;

  return (
    <div className="w-85 bg-white rounded-2xl shadow-2xl shadow-indigo-100/60 border border-gray-100 overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className={`w-1 bg-linear-to-b ${cfg.accent} shrink-0`} />
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 ${cfg.iconBg} rounded-full flex items-center justify-center shrink-0`}
            >
              {cfg.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {cfg.label}
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {body && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {body}
          </p>
        )}

        <button
          onClick={onNavigate}
          className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-1.5 transition-colors"
        >
          View →
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
            if (
              pathnameRef.current.includes(`/messages/${msg.conversation_id}`)
            )
              return;

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
            const sym =
              offer.currency === "EUR" ? "€" : (offer.currency ?? "€");
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

      // ── Offer status updates (buyer receives counter/accepted/declined) ──────
      // No server-side column filter here: `buyer_id=eq.${userId}` on UPDATE
      // events is silently dropped by Supabase when `buyer_id` isn't in the WAL
      // changeset (i.e. wasn't one of the modified columns).  We filter client-
      // side instead and rely on the REPLICA IDENTITY FULL migration as backup.
      const offerUpdateChannel = supabase
        .channel("rt-offer-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "offers",
          },
          async (payload) => {
            const offer = payload.new as any;
            // Only show toast to the buyer of this offer
            if (offer.buyer_id !== userId) return;

            if (offer.status === "countered" && offer.counter_amount != null) {
              // Fetch seller profile + listing title in parallel
              const [{ data: seller }, { data: listing }] = await Promise.all([
                supabase
                  .from("profiles")
                  .select("display_name, avatar_url")
                  .eq("id", offer.seller_id)
                  .single(),
                supabase
                  .from("listings")
                  .select("title")
                  .eq("id", offer.listing_id)
                  .single(),
              ]);

              const sellerName = seller?.display_name || "The seller";
              const listingTitle = listing?.title || "your listing";
              const sym = offer.currency === "EUR" ? "€" : (offer.currency ?? "€");
              const counterAmount = `${sym}${Number(offer.counter_amount).toLocaleString()}`;

              toast.custom(
                (t) => (
                  <CounterOfferToast
                    toastId={t}
                    sellerName={sellerName}
                    avatarUrl={seller?.avatar_url ?? null}
                    listingTitle={listingTitle}
                    counterAmount={counterAmount}
                    onNavigate={() => {
                      toast.dismiss(t);
                      router.push(`/dashboard/offers?offer=${offer.id}`);
                    }}
                  />
                ),
                { duration: 10000, position: "top-right" },
              );
            } else if (offer.status === "accepted" || offer.status === "declined") {
              // Fetch seller profile + listing title in parallel
              const [{ data: seller }, { data: listing }] = await Promise.all([
                supabase
                  .from("profiles")
                  .select("display_name, avatar_url")
                  .eq("id", offer.seller_id)
                  .single(),
                supabase
                  .from("listings")
                  .select("title")
                  .eq("id", offer.listing_id)
                  .single(),
              ]);

              const sellerName = seller?.display_name || "The seller";
              const listingTitle = listing?.title || "your listing";

              toast.custom(
                (t) => (
                  <OfferStatusToast
                    toastId={t}
                    status={offer.status}
                    personName={sellerName}
                    avatarUrl={seller?.avatar_url ?? null}
                    listingTitle={listingTitle}
                    onNavigate={() => {
                      toast.dismiss(t);
                      router.push(`/dashboard/offers?offer=${offer.id}`);
                    }}
                  />
                ),
                { duration: 10000, position: "top-right" },
              );
            }
          },
        )
        .subscribe();

      // ── Notifications ────────────────────────────────────────────────────
      // Offer and message types are already toasted via their own channels above,
      // so we skip them here to avoid duplicates.
      const SKIP_TYPES = new Set([
        "offer_received",
        "offer_accepted",
        "offer_declined",
        "offer_countered",
        "new_message",
      ]);

      const notifChannel = supabase
        .channel(`rt-notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notif = payload.new as any;
            if (SKIP_TYPES.has(notif.type)) return;

            toast.custom(
              (t) => (
                <NotificationToast
                  toastId={t}
                  type={notif.type}
                  title={notif.title}
                  body={notif.body ?? null}
                  onNavigate={() => {
                    toast.dismiss(t);
                    router.push(notif.link ?? "/dashboard/notifications");
                  }}
                />
              ),
              { duration: 8000, position: "top-right" },
            );
          },
        )
        .subscribe();

      channels.push(msgChannel, offerChannel, offerUpdateChannel, notifChannel);
    }

    setup();

    return () => {
      mounted = false;
      channels.forEach(async (ch) => {
        await supabase.removeChannel(ch)
      });
    };
  }, [supabase, router]);

  return null;
}
