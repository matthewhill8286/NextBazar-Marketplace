"use client";

import {
  ArrowRight,
  Calendar,
  Check,
  Crown,
  ExternalLink,
  Loader2,
  Package,
  Palette,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "welcome" | "setup" | "done";

interface Props {
  userId: string;
  userName: string;
  alreadyOnboarded: boolean;
  shopName: string;
  shopSlug: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function darkenHex(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#7A6657";
  const num = Number.parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * -25);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

// ─── Confetti particles ─────────────────────────────────────────────────────

function Confetti() {
  const colors = [
    "#8E7A6B",
    "#7A6657",
    "#059669",
    "#d97706",
    "#dc2626",
    "#0891b2",
    "#ec4899",
    "#f59e0b",
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        const rotation = Math.random() * 360;

        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: "-20px",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `rotate(${rotation}deg)`,
              animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
              opacity: 0,
            }}
          />
        );
      })}

      <style>{`
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg) scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ShopOnboardingWizard({
  userId,
  userName,
  alreadyOnboarded,
  shopName: initialShopName,
  shopSlug: initialShopSlug,
}: Props) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>("welcome");
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Shop setup fields
  const [shopNameValue, setShopNameValue] = useState(
    initialShopName === "My Shop" ? "" : initialShopName,
  );
  const [shopSlug, setShopSlug] = useState(
    initialShopSlug === userId.slice(0, 8) ? "" : initialShopSlug,
  );
  const [shopDescription, setShopDescription] = useState("");
  const [accentColor, setAccentColor] = useState("#8E7A6B");

  // Banner upload
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance from welcome after 3 seconds
  useEffect(() => {
    if (phase === "welcome") {
      const timer = setTimeout(() => setPhase("setup"), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Banner upload ──────────────────────────────────────────────────────

  const handleBannerUpload = useCallback(
    async (file: File) => {
      const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
      if (!ALLOWED.includes(file.type)) {
        toast.error("Invalid file type", {
          description: "Please upload a JPEG, PNG, or WebP image.",
        });
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please choose an image under 4 MB.",
        });
        return;
      }

      setBannerUploading(true);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/banner.${ext}`;

      try {
        const { error } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });
        if (error) {
          toast.error("Upload failed", { description: error.message });
          setBannerUploading(false);
          return;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);
        setBannerUrl(`${publicUrl}?t=${Date.now()}`);
        toast.success("Banner uploaded");
      } catch {
        toast.error("Upload failed");
      } finally {
        setBannerUploading(false);
      }
    },
    [userId, supabase.storage],
  );

  // ─── Finish ─────────────────────────────────────────────────────────────

  async function finishOnboarding() {
    setSaving(true);

    const slugValue = shopSlug
      ? toSlug(shopSlug)
      : toSlug(shopNameValue) || userId.slice(0, 8);

    // Update shop branding
    await supabase
      .from("dealer_shops")
      .update({
        shop_name: shopNameValue.trim() || "My Shop",
        slug: slugValue,
        description: shopDescription.trim() || null,
        accent_color: accentColor,
        banner_url: bannerUrl || null,
      })
      .eq("user_id", userId);

    // Mark onboarding complete if not already
    if (!alreadyOnboarded) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);
    }

    refreshProfile();
    setSaving(false);
    setPhase("done");
  }

  // Get the final slug for display
  const finalSlug = shopSlug
    ? toSlug(shopSlug)
    : toSlug(shopNameValue) || "your-shop";

  const firstName = userName.split(" ")[0] || "there";

  const INPUT_CLS =
    "w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/5 outline-none text-sm transition-colors";

  // ─── Phase: Welcome ─────────────────────────────────────────────────────

  if (phase === "welcome") {
    return (
      <>
        {showConfetti && <Confetti />}
        <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
          <div className="text-center px-6 max-w-lg animate-fade-in">
            {/* Icon */}
            <div className="relative mx-auto mb-10 w-20 h-20">
              <div
                className="absolute inset-0 bg-[#8E7A6B]/20 animate-pulse"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 bg-[#8E7A6B] flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>

            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
              Pro Seller Activated
            </p>
            <h1
              className="text-3xl sm:text-4xl font-light text-[#1a1a1a] mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome{firstName !== "there" ? `, ${firstName}` : ""}
            </h1>
            <p className="text-lg text-[#6b6560] mb-10 max-w-md mx-auto leading-relaxed">
              You now have access to unlimited listings, analytics, a verified
              badge, and your own branded shop page.
            </p>

            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="inline-flex items-center gap-2.5 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Set Up My Shop
            </button>

            <p className="text-xs text-[#8a8280] mt-5 animate-pulse">
              Starting automatically...
            </p>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fadeIn 0.6s ease-out forwards;
            }
          `}</style>
        </div>
      </>
    );
  }

  // ─── Phase: Done ────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center px-6 max-w-lg animate-fade-in">
          {/* Success icon */}
          <div className="relative mx-auto mb-10 w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 animate-ping opacity-20" />
            <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>

          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-4">
            All Set
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light text-[#1a1a1a] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your shop is live
          </h1>
          <p className="text-[#6b6560] mb-2">
            <span className="font-medium text-[#666]">
              {shopNameValue || "Your Shop"}
            </span>{" "}
            is ready for business at
          </p>
          <p className="text-[#8E7A6B] font-mono text-sm mb-10 bg-[#f0eeeb] border border-[#e8e6e3] px-4 py-2.5 inline-block">
            next-bazar.com/shop/{finalSlug}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/post"
              className="inline-flex items-center gap-2.5 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Listing
            </Link>
            <Link
              href="/shop-manager"
              className="inline-flex items-center gap-2 border border-[#e8e6e3] text-[#666] text-xs font-medium tracking-[0.15em] uppercase px-7 py-3.5 hover:bg-[#f0eeeb] transition-colors"
            >
              <Palette className="w-4 h-4" />
              Customize Shop
            </Link>
          </div>

          <div className="mt-8">
            <Link
              href={`/shop/${finalSlug}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#6b6560] hover:text-[#8E7A6B] transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View your public shop page
            </Link>
          </div>

          {/* Profile nudge — only for users who haven't completed user onboarding */}
          {!alreadyOnboarded && (
            <div className="mt-12 bg-white border border-[#e8e6e3] p-6 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#8E7A6B]" />
                </div>
                <div>
                  <p
                    className="font-light text-[#1a1a1a] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Complete your profile
                  </p>
                  <p className="text-xs text-[#6b6560] leading-relaxed mb-3">
                    Add a photo, bio, and social links so buyers know who
                    they&apos;re dealing with. Profiles with photos get 3× more
                    enquiries.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8E7A6B] hover:text-[#7A6657] transition-colors"
                  >
                    Go to profile settings
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
              animation: fadeIn 0.6s ease-out forwards;
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ─── Phase: Setup ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#8E7A6B] flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-light text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Set Up Your Shop
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        {/* Step header */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-3">
            Shop Details
          </p>
          <h1
            className="text-2xl font-light text-[#1a1a1a] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Name your shop &amp; pick your look
          </h1>
          <p className="text-[#6b6560] text-sm">
            This is what buyers see when they visit your shop. You can always
            change this later.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Shop setup form ──────────────────────────────────────────── */}
          <div className="bg-white border border-[#e8e6e3] p-7 space-y-6">
            {/* Shop Name */}
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                Shop Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={shopNameValue}
                onChange={(e) => {
                  const name = e.target.value;
                  setShopNameValue(name);
                  setShopSlug(toSlug(name));
                }}
                placeholder="e.g. Elite Motors, Vintage Finds, Tech Hub"
                className={INPUT_CLS}
              />
            </div>

            {/* Shop URL */}
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                Shop URL
              </label>
              <div className="flex items-center border border-[#e8e6e3] overflow-hidden focus-within:border-[#8E7A6B] focus-within:ring-2 focus-within:ring-[#8E7A6B]/5">
                <span className="px-4 py-3 text-sm text-[#8a8280] bg-[#faf9f7] border-r border-[#e8e6e3] whitespace-nowrap">
                  next-bazar.com/shop/
                </span>
                <input
                  type="text"
                  value={shopSlug}
                  onChange={(e) => setShopSlug(toSlug(e.target.value))}
                  placeholder="your-shop"
                  className="flex-1 px-4 py-3 outline-none text-sm font-mono"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                Brand Colour
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 border border-[#e8e6e3] cursor-pointer"
                />
                <div className="flex gap-2">
                  {[
                    "#8E7A6B",
                    "#059669",
                    "#dc2626",
                    "#d97706",
                    "#7A6657",
                    "#0891b2",
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className={`w-8 h-8 transition-all ${
                        accentColor === c
                          ? "ring-2 ring-offset-2 ring-[#8E7A6B] scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560] mb-2">
                Shop Description{" "}
                <span className="normal-case tracking-normal text-[#8a8280]">
                  (optional)
                </span>
              </label>
              <textarea
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                rows={3}
                placeholder="Tell buyers about your business, specialities, opening hours..."
                className={`${INPUT_CLS} resize-none`}
              />
            </div>

            {/* Hidden file input for banner */}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBannerUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* ── Live shop preview ──────────────────────────────────────────── */}
          <div className="border border-[#e8e6e3] overflow-hidden bg-[#faf9f7]">
            <div className="px-5 py-3 border-b border-[#e8e6e3] bg-white flex items-center justify-between">
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#6b6560]">
                Live Preview
              </p>
              <span className="text-[10px] text-[#8a8280] font-medium">
                Updates as you type
              </span>
            </div>

            {/* Hero banner — doubles as upload drop zone */}
            <div
              className="relative group/banner cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleBannerUpload(file);
              }}
              onClick={() => bannerInputRef.current?.click()}
            >
              {bannerUrl ? (
                <div
                  className={`relative h-36 sm:h-44 w-full overflow-hidden transition-all ${dragOver ? "ring-2 ring-inset ring-[#8E7A6B]" : ""}`}
                >
                  <Image
                    src={bannerUrl}
                    alt="Shop banner preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
                </div>
              ) : (
                <div
                  className={`h-36 sm:h-44 w-full overflow-hidden transition-all relative ${dragOver ? "ring-2 ring-inset ring-[#8E7A6B]" : ""}`}
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${darkenHex(accentColor)} 50%, ${darkenHex(darkenHex(accentColor))} 100%)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Upload / change overlay */}
              {bannerUploading ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : (
                <div className={`absolute inset-0 flex items-center justify-center transition-colors z-10 ${dragOver ? "bg-indigo-600/30" : "bg-black/0 group-hover/banner:bg-black/30"}`}>
                  <span className={`flex items-center gap-2 bg-white/90 text-gray-700 text-xs font-semibold px-3.5 py-2 rounded-full shadow-sm transition-opacity ${dragOver ? "opacity-100" : "opacity-0 group-hover/banner:opacity-100"}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {bannerUrl ? "Change Banner" : "Upload Banner"}
                  </span>
                </div>
              )}

              {/* Remove button — only when banner exists */}
              {bannerUrl && !bannerUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerUrl("");
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover/banner:opacity-100 transition-opacity hover:bg-black/80 z-20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Upload / change overlay */}
              {bannerUploading ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : (
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-colors z-10 ${dragOver ? "bg-[#8E7A6B]/30" : "bg-black/0 group-hover/banner:bg-black/30"}`}
                >
                  <span
                    className={`flex items-center gap-2 bg-white/90 text-[#666] text-xs font-medium px-3.5 py-2 shadow-sm transition-opacity ${dragOver ? "opacity-100" : "opacity-0 group-hover/banner:opacity-100"}`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {bannerUrl ? "Change Banner" : "Upload Banner"}
                  </span>
                </div>
              )}

              {/* Remove button — only when banner exists */}
              {bannerUrl && !bannerUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerUrl("");
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover/banner:opacity-100 transition-opacity hover:bg-black/80 z-20"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Shop info card */}
            <div className="mx-3 -mt-10 relative z-10">
              <div className="bg-white border border-[#e8e6e3] overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div
                      className="w-16 h-16 overflow-hidden border-4 border-white shadow-md shrink-0 -mt-10"
                      style={{
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}, ${darkenHex(accentColor)})`,
                        }}
                      >
                        {shopNameValue
                          ? shopNameValue
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : "?"}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 mb-2">
                        <h3
                          className="text-lg font-light text-[#1a1a1a] truncate"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {shopNameValue || "Your Shop"}
                        </h3>
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 text-white text-[10px] font-medium tracking-[0.1em] uppercase w-fit"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor}, ${darkenHex(accentColor)})`,
                          }}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Verified Pro Seller
                        </span>
                      </div>

                      {shopDescription && (
                        <p className="text-sm text-[#666] leading-relaxed mb-3 line-clamp-2">
                          {shopDescription}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b6560]">
                        <span className="inline-flex items-center gap-1.5 bg-[#faf9f7] px-2.5 py-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8a8280]" />
                          Member since March 2026
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-[#faf9f7] px-2.5 py-1">
                          <Package className="w-3.5 h-3.5 text-[#8a8280]" />0
                          listings
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="border-t border-[#e8e6e3] bg-[#faf9f7]/50">
                  <div className="grid grid-cols-3 divide-x divide-[#e8e6e3]">
                    <div className="text-center py-3 px-3">
                      <div
                        className="text-lg font-light text-[#1a1a1a]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        0
                      </div>
                      <div className="text-[10px] text-[#6b6560] mt-0.5 font-medium tracking-[0.1em] uppercase">
                        Active
                      </div>
                    </div>
                    <div className="text-center py-3 px-3">
                      <div
                        className="text-lg font-light text-[#1a1a1a]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        0
                      </div>
                      <div className="text-[10px] text-[#6b6560] mt-0.5 font-medium tracking-[0.1em] uppercase">
                        Views
                      </div>
                    </div>
                    <div className="text-center py-3 px-3">
                      <div className="text-lg font-light text-[#1a1a1a] flex items-center justify-center gap-1">
                        <ShieldCheck
                          className="w-4 h-4"
                          style={{ color: accentColor }}
                        />
                        <span
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          PRO
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6b6560] mt-0.5 font-medium tracking-[0.1em] uppercase">
                        Status
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty listings placeholder */}
            <div className="mx-3 mt-3 mb-3">
              <div className="bg-white border border-[#e8e6e3] py-8 text-center">
                <div
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}20, ${darkenHex(accentColor)}20)`,
                  }}
                >
                  <Store className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <h3
                  className="font-light text-[#1a1a1a] mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  No listings yet
                </h3>
                <p className="text-xs text-[#6b6560] max-w-xs mx-auto">
                  Your listings will appear here once you start posting.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Launch button ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-10 mb-14">
          <button
            type="button"
            onClick={() => {
              router.push("/shop-manager");
              router.refresh();
            }}
            className="text-sm text-[#8a8280] hover:text-[#666] font-medium transition-colors"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={finishOnboarding}
            disabled={saving || !shopNameValue.trim()}
            className="inline-flex items-center gap-2.5 bg-[#8E7A6B] text-white text-xs font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#7A6657] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            Launch My Shop
          </button>
        </div>
      </div>
    </div>
  );
}
