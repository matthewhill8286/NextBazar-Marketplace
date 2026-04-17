"use client";

import { Check, Flag, Heart, Loader2, Share2, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { useSaved } from "@/lib/saved-context";
import { createClient } from "@/lib/supabase/client";

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "scam", label: "Scam or fraud" },
  { value: "spam", label: "Spam or duplicate" },
  { value: "counterfeit", label: "Counterfeit / fake item" },
  { value: "wrong_category", label: "Wrong category" },
  { value: "offensive", label: "Offensive or inappropriate" },
  { value: "already_sold", label: "Already sold / unavailable" },
  { value: "other", label: "Other" },
];

export function FavoriteAction({ listingId }: { listingId: string }) {
  const { isSaved, toggle } = useSaved();
  const [animating, setAnimating] = useState(false);
  const saved = isSaved(listingId);

  async function handleToggle() {
    setAnimating(true);
    await toggle(listingId);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition-all ${
        saved
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-white border-[#e8e6e3] text-[#666] hover:border-[#e8e6e3]"
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-transform ${animating ? "scale-125" : ""} ${saved ? "fill-red-500 text-red-500" : ""}`}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export function ShareAction({ title, slug }: { title: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use the current page URL directly — preserves locale prefix and origin
  const url =
    typeof window !== "undefined" ? window.location.href : `/listing/${slug}`;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 border border-[#e8e6e3] bg-white text-sm font-medium text-[#666] hover:border-[#d4d0cc] transition-colors"
      >
        <Share2 className="w-4 h-4" /> Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white border border-[#e8e6e3] shadow-lg py-1">
            {/* WhatsApp — most important for Cyprus market */}
            <a
              href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors w-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-[#25D366] shrink-0"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors w-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-[#1877F2] shrink-0"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>

            {/* X (Twitter) */}
            <a
              href={`https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors w-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-[#1a1a1a] shrink-0"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X (Twitter)
            </a>

            <div className="border-t border-[#e8e6e3] my-1" />

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f0eeeb] transition-colors w-full"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Copy link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ReportAction({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  /* ── Feature-gated: hide report button until reports dashboard is ready ── */
  if (!FEATURE_FLAGS.REPORTS) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || submitting) return;
    setSubmitting(true);

    if (!userId) {
      window.location.href = `/auth/login?redirect=${window.location.pathname}`;
      return;
    }

    await supabase.from("reports").insert({
      reporter_id: userId,
      listing_id: listingId,
      reason,
      details: details.trim() || null,
    });

    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600">
        <Check className="w-3 h-3" /> Report submitted
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[#8a8280] hover:text-red-500 transition-colors"
      >
        <Flag className="w-3 h-3" />
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-white shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
              <h2 className="font-semibold text-[#1a1a1a]">Report Listing</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-[#f0eeeb] transition-colors text-[#8a8280]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#666] mb-2">
                  What's the issue?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                        reason === r.value
                          ? "border-red-400 bg-red-50"
                          : "border-[#e8e6e3] hover:border-[#e8e6e3]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-red-500"
                      />
                      <span className="text-sm text-[#666]">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666] mb-1.5">
                  Additional details{" "}
                  <span className="text-[#8a8280] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#e8e6e3] bg-[#faf9f7] focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-[#e8e6e3] text-sm font-medium text-[#666] hover:bg-[#faf9f7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason || submitting}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ContactButtons({
  listingId,
  sellerId,
  listingTitle,
  contactPhone,
  whatsappNumber,
  telegramUsername,
  disabled = false,
  accentColor,
}: {
  listingId: string;
  sellerId: string;
  listingTitle?: string;
  contactPhone: string | null;
  whatsappNumber?: string | null;
  telegramUsername?: string | null;
  accentColor?: string | null;
  disabled?: boolean;
}) {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { userId } = useAuth();

  // Build WhatsApp deep link — strip spaces/dashes, keep + prefix
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[\s\-().]/g, "")}?text=${encodeURIComponent(
        `Hi! I'm interested in your listing: ${listingTitle || ""}`,
      )}`
    : null;

  // Telegram: open DM by username or by phone number
  const tgLink = telegramUsername ? `https://t.me/${telegramUsername}` : null;

  async function handleMessage() {
    setLoading(true);

    if (!userId) {
      window.location.href = `/auth/login?redirect=${window.location.pathname}`;
      return;
    }

    if (userId === sellerId) {
      // Can't message yourself
      setLoading(false);
      return;
    }

    // Check if conversation already exists for this listing + buyer
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", userId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (existing) {
      window.location.href = `/dashboard/messages/${existing.id}`;
      return;
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: userId,
        seller_id: sellerId,
      })
      .select("id")
      .single();

    if (newConv) {
      window.location.href = `/dashboard/messages/${newConv.id}`;
    }
    setLoading(false);
  }

  // Use shop accent color for the primary CTA when available
  const brandColor = accentColor || "#8E7A6B";
  const brandColorDark = accentColor
    ? `color-mix(in srgb, ${accentColor} 85%, black)`
    : "#7A6657";

  return (
    <div className="space-y-2.5">
      {/* In-app message */}
      <button
        onClick={handleMessage}
        disabled={loading || disabled}
        style={
          disabled
            ? { backgroundColor: `${brandColor}60` }
            : { backgroundColor: brandColor }
        }
        className={`w-full py-3.5 font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm ${disabled ? "text-white/80 cursor-not-allowed shadow-none" : "text-white hover:brightness-90 disabled:opacity-50"}`}
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        Send Message
      </button>

      {/* WhatsApp */}
      {(waLink || disabled) &&
        (disabled ? (
          <span className="w-full bg-[#25D366]/50 text-white/80 py-3.5 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white/80"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </span>
        ) : (
          <a
            href={waLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-3.5 font-semibold hover:bg-[#20b858] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-200"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </a>
        ))}

      {/* Telegram */}
      {(tgLink || disabled) &&
        (disabled ? (
          <span className="w-full bg-[#229ED9]/50 text-white/80 py-3.5 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white/80"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Message on Telegram
          </span>
        ) : (
          <a
            href={tgLink!}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#229ED9] text-white py-3.5 font-semibold hover:bg-[#1a8bbf] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Message on Telegram
          </a>
        ))}

      {/* Phone reveal */}
      {(contactPhone || disabled) && (
        <button
          onClick={() => !disabled && setPhoneVisible(!phoneVisible)}
          disabled={disabled}
          className={`w-full py-3 font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${disabled ? "bg-[#f0eeeb] text-[#8a8280] cursor-not-allowed" : "bg-[#f0eeeb] text-[#1a1a1a] hover:bg-[#f0eeeb]"}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          {phoneVisible ? contactPhone : "Show Phone Number"}
        </button>
      )}
    </div>
  );
}
