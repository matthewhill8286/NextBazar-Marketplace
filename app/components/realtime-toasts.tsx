"use client";

import { Bell, MessageCircle, Tag, TrendingDown, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useRealtimeTable } from "@/lib/hooks/use-realtime-table";
import { createClient } from "@/lib/supabase/client";

// ─── Custom toast UIs ────────────────────────────────────────────────────────

function CounterOfferToast({
  toastId,
  sellerName,
  avatarUrl,
  listingTitle,
  counterAmount,
  onNavigateAction,
  reviewCounterLabel,
}: {
  toastId: string | number;
  sellerName: string;
  avatarUrl: string | null;
  listingTitle: string;
  counterAmount: string;
  onNavigateAction: () => void;
  reviewCounterLabel: string;
}) {
  return (
    <div className="w-85 bg-white shadow-2xl shadow-[#e8e6e3]/60 border border-[#e8e6e3] overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-linear-to-b from-[#8E7A6B] to-[#7A6657] shrink-0" />
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
              <div className="w-8 h-8 bg-[#e8e6e3] rounded-full flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-[#8E7A6B]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#8E7A6B] uppercase tracking-widest">
                Counter offer received
              </p>
              <p className="text-sm font-bold text-[#1a1a1a] truncate">
                {sellerName}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-[#8a8280] hover:text-[#6b6560] transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-[#8a8280] truncate mb-1.5">
          {listingTitle}
        </p>

        <div className="flex items-center justify-center bg-[#f0eeeb] border border-[#e8e6e3] py-2 mb-3">
          <span className="text-xl font-extrabold text-[#8E7A6B]">
            {counterAmount}
          </span>
        </div>

        <button
          onClick={onNavigateAction}
          className="w-full text-center text-xs font-semibold text-[#8E7A6B] hover:text-[#7A6657] bg-[#f0eeeb] hover:bg-[#e8e6e3] py-1.5 transition-colors"
        >
          {reviewCounterLabel}
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
  onNavigateAction,
  offerAcceptedLabel,
  offerDeclinedLabel,
  viewOfferLabel,
}: {
  toastId: string | number;
  status: "accepted" | "declined";
  personName: string;
  avatarUrl: string | null;
  listingTitle: string;
  onNavigateAction: () => void;
  offerAcceptedLabel: string;
  offerDeclinedLabel: string;
  viewOfferLabel: string;
}) {
  const isAccepted = status === "accepted";
  const statusLabel = isAccepted ? offerAcceptedLabel : offerDeclinedLabel;
  return (
    <div
      className={`w-85 bg-white shadow-2xl border border-[#e8e6e3] overflow-hidden flex animate-in slide-in-from-right-4 duration-300 ${isAccepted ? "shadow-emerald-100/60" : "shadow-rose-100/60"}`}
    >
      <div
        className={`w-1 shrink-0 ${isAccepted ? "bg-linear-to-b from-emerald-500 to-teal-600" : "bg-linear-to-b from-rose-500 to-red-600"}`}
      />
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
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAccepted ? "bg-emerald-100" : "bg-rose-100"}`}
              >
                <Tag
                  className={`w-4 h-4 ${isAccepted ? "text-emerald-600" : "text-rose-600"}`}
                />
              </div>
            )}
            <div className="min-w-0">
              <p
                className={`text-[10px] font-bold uppercase tracking-widest ${isAccepted ? "text-emerald-500" : "text-rose-500"}`}
              >
                {statusLabel}
              </p>
              <p className="text-sm font-bold text-[#1a1a1a] truncate">
                {personName}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-[#8a8280] hover:text-[#6b6560] transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-[#8a8280] truncate mb-3">
          {listingTitle}
        </p>

        <button
          onClick={onNavigateAction}
          className={`w-full text-center text-xs font-semibold py-1.5 transition-colors ${isAccepted ? "text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100"}`}
        >
          {viewOfferLabel}
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
  onNavigateAction,
  inChatOfferLabel,
  newMessageLabel,
  viewConversationLabel,
}: {
  toastId: string | number;
  senderName: string;
  avatarUrl: string | null;
  listingTitle: string;
  preview: string;
  isOffer: boolean;
  onNavigateAction: () => void;
  inChatOfferLabel: string;
  newMessageLabel: string;
  viewConversationLabel: string;
}) {
  const headerLabel = isOffer ? inChatOfferLabel : newMessageLabel;
  return (
    <div className="w-85 bg-white shadow-2xl shadow-[#e8e6e3]/60 border border-[#e8e6e3] overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
      <div className="w-1 bg-linear-to-b from-[#8E7A6B] to-[#7A6657] shrink-0" />
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
              <div className="w-8 h-8 bg-[#e8e6e3] rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-[#8E7A6B]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#8E7A6B] uppercase tracking-widest">
                {headerLabel}
              </p>
              <p className="text-sm font-bold text-[#1a1a1a] truncate">
                {senderName}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-[#8a8280] hover:text-[#6b6560] transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-[#8a8280] truncate mb-1.5">
          Re: {listingTitle}
        </p>

        {preview && (
          <p className="text-xs text-[#666] line-clamp-2 mb-3 bg-[#faf9f7] px-2.5 py-1.5 border border-[#e8e6e3]">
            &ldquo;{preview}&rdquo;
          </p>
        )}

        <button
          onClick={onNavigateAction}
          className="w-full text-center text-xs font-semibold text-[#8E7A6B] hover:text-[#7A6657] bg-[#f0eeeb] hover:bg-[#e8e6e3] py-1.5 transition-colors"
        >
          {viewConversationLabel}
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
  onNavigateAction,
  newOfferReceivedLabel,
  reviewOfferLabel,
}: {
  toastId: string | number;
  buyerName: string;
  avatarUrl: string | null;
  listingTitle: string;
  amount: string;
  onNavigateAction: () => void;
  newOfferReceivedLabel: string;
  reviewOfferLabel: string;
}) {
  return (
    <div className="w-85 bg-white shadow-2xl shadow-emerald-100/60 border border-[#e8e6e3] overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
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
                {newOfferReceivedLabel}
              </p>
              <p className="text-sm font-bold text-[#1a1a1a] truncate">
                {buyerName}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-[#8a8280] hover:text-[#6b6560] transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-[#8a8280] truncate mb-1.5">
          {listingTitle}
        </p>

        <div className="flex items-center justify-center bg-emerald-50 border border-emerald-100 py-2 mb-3">
          <span className="text-xl font-extrabold text-emerald-600">
            {amount}
          </span>
        </div>

        <button
          onClick={onNavigateAction}
          className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 transition-colors"
        >
          {reviewOfferLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Notification type config ────────────────────────────────────────────────

const NOTIF_CONFIG: Record<
  string,
  { accent: string; iconBg: string; icon: React.ReactNode }
> = {
  price_drop: {
    accent: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100",
    icon: <TrendingDown className="w-4 h-4 text-emerald-600" />,
  },
  saved_search_match: {
    accent: "from-[#8E7A6B] to-[#7A6657]",
    iconBg: "bg-[#f0eeeb]",
    icon: <Bell className="w-4 h-4 text-[#8E7A6B]" />,
  },
  listing_expired: {
    accent: "from-rose-500 to-red-600",
    iconBg: "bg-rose-100",
    icon: <Bell className="w-4 h-4 text-rose-600" />,
  },
};

const NOTIF_DEFAULT = {
  accent: "from-[#8E7A6B] to-[#7A6657]",
  iconBg: "bg-[#e8e6e3]",
  icon: <Bell className="w-4 h-4 text-[#8E7A6B]" />,
};

function NotificationToast({
  toastId,
  type,
  title,
  body,
  onNavigateAction,
  label,
  viewLabel,
}: {
  toastId: string | number;
  type: string;
  title: string;
  body: string | null;
  onNavigateAction: () => void;
  label: string;
  viewLabel: string;
}) {
  const cfg = NOTIF_CONFIG[type] ?? NOTIF_DEFAULT;

  return (
    <div className="w-85 bg-white shadow-2xl shadow-[#e8e6e3]/60 border border-[#e8e6e3] overflow-hidden flex animate-in slide-in-from-right-4 duration-300">
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
              <p className="text-[10px] font-bold text-[#8a8280] uppercase tracking-widest">
                {label}
              </p>
              <p className="text-sm font-bold text-[#1a1a1a] truncate">
                {title}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="text-[#8a8280] hover:text-[#6b6560] transition-colors mt-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {body && (
          <p className="text-xs text-[#6b6560] line-clamp-2 mb-3 leading-relaxed">
            {body}
          </p>
        )}

        <button
          onClick={onNavigateAction}
          className="w-full text-center text-xs font-semibold text-[#8E7A6B] hover:text-[#7A6657] bg-[#f0eeeb] hover:bg-[#e8e6e3] py-1.5 transition-colors"
        >
          {viewLabel}
        </button>
      </div>
    </div>
  );
}

// Offer + message notification types already get a dedicated toast — skip in the
// generic notifications channel to avoid showing the same event twice.
const SKIP_NOTIF_TYPES = new Set([
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "offer_countered",
  "new_message",
]);

// ─── Main component ───────────────────────────────────────────────────────────

export default function RealtimeToasts() {
  const t = useTranslations("notifications");
  const supabase = createClient();
  const { userId } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  // Keep a ref to always have the current pathname inside async callbacks
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // ── New message subscription ──────────────────────────────────────────────
  // RLS ensures only messages in the user's conversations are delivered.
  useRealtimeTable({
    channelName: "rt-new-messages",
    table: "messages",
    event: "INSERT",
    onPayload: async ({ new: msg }) => {
      if (!userId || msg.sender_id === userId) return;
      if (
        pathnameRef.current.includes(
          `/dashboard/messages/${msg.conversation_id}`,
        )
      )
        return;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listingTitle = (conv?.listings as any)?.title || "a listing";
      const isOffer = msg.message_type === "offer";
      const preview = isOffer
        ? t("offeredPrice", {
            amount: Number(msg.offer_price).toLocaleString(),
          })
        : String(msg.content || "").slice(0, 100);

      toast.custom(
        (toastId) => (
          <MessageToast
            toastId={toastId}
            senderName={senderName}
            avatarUrl={sender?.avatar_url ?? null}
            listingTitle={listingTitle}
            preview={preview}
            isOffer={isOffer}
            onNavigateAction={() => {
              toast.dismiss(toastId);
              router.push(`/dashboard/messages/${msg.conversation_id}`);
            }}
            inChatOfferLabel={t("inChatOffer")}
            newMessageLabel={t("newMessage")}
            viewConversationLabel={t("viewConversation")}
          />
        ),
        { duration: 7000, position: "top-right" },
      );
    },
    enabled: !!userId,
  });

  // ── New offer subscription (seller receives) ──────────────────────────────
  useRealtimeTable({
    channelName: "rt-new-offers",
    table: "offers",
    event: "INSERT",
    filter: userId ? `seller_id=eq.${userId}` : undefined,
    onPayload: async ({ new: offer }) => {
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
        (toastId) => (
          <OfferToast
            toastId={toastId}
            buyerName={buyerName}
            avatarUrl={buyer?.avatar_url ?? null}
            listingTitle={listingTitle}
            amount={amount}
            onNavigateAction={() => {
              toast.dismiss(toastId);
              router.push(`/dashboard/offers?offer=${offer.id}`);
            }}
            newOfferReceivedLabel={t("newOfferReceived")}
            reviewOfferLabel={t("reviewOffer")}
          />
        ),
        { duration: 10000, position: "top-right" },
      );
    },
    enabled: !!userId,
  });

  // ── Offer status updates (buyer receives counter / accepted / declined) ───
  // No server-side column filter: `buyer_id=eq.${userId}` on UPDATE is silently
  // dropped when `buyer_id` isn't in the WAL changeset. Filter client-side instead.
  useRealtimeTable({
    channelName: "rt-offer-updates",
    table: "offers",
    event: "UPDATE",
    onPayload: async ({ new: offer }) => {
      if (!userId || offer.buyer_id !== userId) return;

      if (offer.status === "countered" && offer.counter_amount != null) {
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
          (toastId) => (
            <CounterOfferToast
              toastId={toastId}
              sellerName={sellerName}
              avatarUrl={seller?.avatar_url ?? null}
              listingTitle={listingTitle}
              counterAmount={counterAmount}
              onNavigateAction={() => {
                toast.dismiss(toastId);
                router.push(`/dashboard/offers?offer=${offer.id}`);
              }}
              reviewCounterLabel={t("reviewCounter")}
            />
          ),
          { duration: 10000, position: "top-right" },
        );
      } else if (offer.status === "accepted" || offer.status === "declined") {
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
          (toastId) => (
            <OfferStatusToast
              toastId={toastId}
              status={offer.status as "accepted" | "declined"}
              personName={sellerName}
              avatarUrl={seller?.avatar_url ?? null}
              listingTitle={listingTitle}
              onNavigateAction={() => {
                toast.dismiss(toastId);
                router.push(`/dashboard/offers?offer=${offer.id}`);
              }}
              offerAcceptedLabel={t("offerAccepted")}
              offerDeclinedLabel={t("offerDeclined")}
              viewOfferLabel={t("viewOffer")}
            />
          ),
          { duration: 10000, position: "top-right" },
        );
      }
    },
    enabled: !!userId,
  });

  // Helper to get notification label based on type
  const getNotificationLabel = (type: string): string => {
    switch (type) {
      case "price_drop":
        return t("priceDrop");
      case "saved_search_match":
        return t("savedSearchMatch");
      case "listing_expired":
        return t("listingExpired");
      default:
        return t("notification");
    }
  };

  // ── Generic notifications ────────────────────────────────────────────────
  useRealtimeTable({
    channelName: `rt-notifications-${userId ?? "anon"}`,
    table: "notifications",
    event: "INSERT",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onPayload: ({ new: notif }) => {
      if (SKIP_NOTIF_TYPES.has(String(notif.type))) return;
      const notifType = String(notif.type);
      toast.custom(
        (toastId) => (
          <NotificationToast
            toastId={toastId}
            type={notifType}
            title={String(notif.title)}
            body={notif.body ? String(notif.body) : null}
            onNavigateAction={() => {
              toast.dismiss(toastId);
              router.push(String(notif.link ?? "/dashboard/notifications"));
            }}
            label={getNotificationLabel(notifType)}
            viewLabel={t("view")}
          />
        ),
        { duration: 8000, position: "top-right" },
      );
    },
    enabled: !!userId,
  });

  return null;
}
