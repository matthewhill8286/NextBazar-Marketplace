"use client";

import { Check, Flag, Heart, Loader2, Share2, X } from "lucide-react";
import { useState } from "react";
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
        saved
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
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
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/listing/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" /> Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" /> Share
        </>
      )}
    </button>
  );
}

export function ReportAction({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || submitting) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth/login?redirect=${window.location.pathname}`;
      return;
    }

    await supabase.from("reports").insert({
      reporter_id: user.id,
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
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Report Listing</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's the issue?
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        reason === r.value
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
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
                      <span className="text-sm text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional details{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason || submitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
}: {
  listingId: string;
  sellerId: string;
  listingTitle?: string;
  contactPhone: string | null;
  whatsappNumber?: string | null;
  telegramUsername?: string | null;
}) {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = `/auth/login?redirect=${window.location.pathname}`;
      return;
    }

    if (user.id === sellerId) {
      // Can't message yourself
      setLoading(false);
      return;
    }

    // Check if conversation already exists for this listing + buyer
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (existing) {
      window.location.href = `/messages/${existing.id}`;
      return;
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select("id")
      .single();

    if (newConv) {
      window.location.href = `/messages/${newConv.id}`;
    }
    setLoading(false);
  }

  return (
    <div className="space-y-2.5">
      {/* In-app message */}
      <button
        onClick={handleMessage}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-50"
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
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-semibold hover:bg-[#20b858] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-200"
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
      )}

      {/* Telegram */}
      {tgLink && (
        <a
          href={tgLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#229ED9] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1a8bbf] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
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
      )}

      {/* Phone reveal */}
      {contactPhone && (
        <button
          onClick={() => setPhoneVisible(!phoneVisible)}
          className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
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
