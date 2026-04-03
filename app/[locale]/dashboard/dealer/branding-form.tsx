"use client";

import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Loader2,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type BrandingState = {
  shopName: string;
  slug: string;
  description: string;
  accentColor: string;
  bannerUrl: string;
  website: string;
  facebook: string;
  instagram: string;
};

type Props = {
  state: BrandingState;
  saving: boolean;
  bannerUploading: boolean;
  /** When true the slug is already persisted and should not change. */
  slugLocked?: boolean;
  onChange: <K extends keyof BrandingState>(
    key: K,
    value: BrandingState[K],
  ) => void;
  onBannerUploadAction: (file: File) => void;
  onBannerRemoveAction: () => void;
  onSaveAction: () => void;
};

function darkenHex(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#4338ca";
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * -25);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/** Generate a URL-safe slug from a shop name. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BrandingForm({
  state,
  saving,
  bannerUploading,
  slugLocked = false,
  onChange,
  onBannerUploadAction,
  onBannerRemoveAction,
  onSaveAction,
}: Props) {
  const {
    shopName,
    slug,
    description,
    accentColor,
    bannerUrl,
    website,
    facebook,
    instagram,
  } = state;

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiWriting, setAiWriting] = useState(false);

  function handleBannerFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Banner must be under 5 MB");
      return;
    }
    onBannerUploadAction(file);
  }

  function handleBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleBannerFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleBannerFile(file);
  }

  async function handleAiWrite() {
    if (!shopName) return;
    setAiWriting(true);
    try {
      const res = await fetch("/api/ai/shop-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          currentDescription: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.description) {
        onChange("description", data.description);
      }
    } catch {
      // silently fail — user can retry
    }
    setAiWriting(false);
  }

  return (
    <div className="bg-white border border-[#e8e6e3] p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#8a8280]" />
          Shop Branding
        </h3>
        <p className="text-sm text-[#6b6560]">
          Customise how your shop appears to buyers.
        </p>
      </div>

      {/* Hidden file input for banner */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleBannerSelect}
      />

      {/* ── Live shop preview — mirrors /shop/[slug] ──────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-[#666]">
            Shop Preview
          </label>
          {slug && (
            <Link
              href={`/shop/${slug}`}
              target="_blank"
              className="text-xs text-[#8E7A6B] hover:text-[#7A6657] font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View live shop
            </Link>
          )}
        </div>
        <div className="overflow-hidden border border-[#e8e6e3] bg-[#faf9f7] shadow-sm">
          {/* Hero banner — doubles as upload drop zone */}
          <div
            className="relative group/banner cursor-pointer"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
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
              </div>
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
                  className={`flex items-center gap-2 bg-white/90 text-[#666] text-xs font-semibold px-3.5 py-2 rounded-full shadow-sm transition-opacity ${dragOver ? "opacity-100" : "opacity-0 group-hover/banner:opacity-100"}`}
                >
                  <Upload className="w-3.5 h-3.5" />
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
                  onBannerRemoveAction();
                }}
                className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover/banner:opacity-100 transition-opacity hover:bg-black/80 z-20"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Shop info card */}
          <div className="mx-3 -mt-10 relative z-10">
            <div className="bg-white border border-[#e8e6e3] shadow-sm overflow-hidden">
              <div className="p-5">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 mb-2">
                    <h3 className="text-lg font-bold text-[#1a1a1a] truncate">
                      {shopName || "Your Shop"}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-white text-[10px] font-semibold w-fit"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${darkenHex(accentColor)})`,
                      }}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Verified Pro Seller
                    </span>
                  </div>

                  {description ? (
                    <p className="text-sm text-[#666] leading-relaxed mb-3 line-clamp-2">
                      {description}
                    </p>
                  ) : (
                    <p className="text-sm text-[#8a8280] italic mb-3">
                      Add a description to tell buyers about your business...
                    </p>
                  )}

                  {/* Meta chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b6560]">
                    {website && (
                      <span className="p-1.5 bg-[#faf9f7]">
                        <Globe className="w-3.5 h-3.5 text-[#8a8280]" />
                      </span>
                    )}
                    {facebook && (
                      <span className="p-1.5 bg-[#faf9f7]">
                        <Facebook className="w-3.5 h-3.5 text-[#8a8280]" />
                      </span>
                    )}
                    {instagram && (
                      <span className="p-1.5 bg-[#faf9f7]">
                        <Instagram className="w-3.5 h-3.5 text-[#8a8280]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div className="border-t border-[#e8e6e3] bg-[#faf9f7]/50">
                <div className="grid grid-cols-3 divide-x divide-[#e8e6e3]">
                  <div className="text-center py-3 px-3">
                    <div className="text-lg font-bold text-[#1a1a1a]">0</div>
                    <div className="text-[10px] text-[#6b6560] mt-0.5 font-medium">
                      Active Listings
                    </div>
                  </div>
                  <div className="text-center py-3 px-3">
                    <div className="text-lg font-bold text-[#1a1a1a]">0</div>
                    <div className="text-[10px] text-[#6b6560] mt-0.5 font-medium">
                      Total Views
                    </div>
                  </div>
                  <div className="text-center py-3 px-3">
                    <div className="text-lg font-bold text-[#1a1a1a] flex items-center justify-center gap-1">
                      <ShieldCheck
                        className="w-4 h-4"
                        style={{ color: accentColor }}
                      />
                      PRO
                    </div>
                    <div className="text-[10px] text-[#6b6560] mt-0.5 font-medium">
                      Seller Status
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty listings area */}
          <div className="mx-3 mt-3 mb-3">
            <div className="bg-white border border-[#e8e6e3] py-8 text-center">
              <Store className="w-8 h-8 text-[#8a8280] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#1a1a1a] mb-1">
                No listings yet
              </p>
              <p className="text-xs text-[#6b6560]">
                Listings will appear here once posted.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shop Name */}
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            Shop Name
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => {
              const name = e.target.value;
              onChange("shopName", name);
              if (!slugLocked) {
                onChange("slug", toSlug(name));
              }
            }}
            placeholder="Elite Motors"
            className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            Accent Colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onChange("accentColor", e.target.value)}
              className="w-12 h-12 border border-[#e8e6e3] cursor-pointer"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => onChange("accentColor", e.target.value)}
              className="flex-1 px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm font-mono"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            Website{" "}
            <span className="text-[#8a8280] font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://www.example.com"
            className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-[#666]">
            Shop Description
          </label>
          <button
            type="button"
            onClick={handleAiWrite}
            disabled={aiWriting || !shopName}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-gradient-to-r from-[#f0eeeb] to-[#f0eeeb] text-[#7A6657] hover:from-[#e8e6e3] hover:to-[#e8e6e3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiWriting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {aiWriting
              ? "Writing..."
              : description
                ? "Improve with AI"
                : "Write with AI"}
            {!aiWriting && (
              <span className="text-[9px] bg-[#e8e6e3] text-[#7A6657] px-1 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Beta
              </span>
            )}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder="Tell buyers about your business, specialities, opening hours..."
          className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm resize-none"
        />
      </div>

      {/* Social Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            Facebook
          </label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => onChange("facebook", e.target.value)}
            placeholder="https://facebook.com/yourpage"
            className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#666] mb-1.5">
            Instagram
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => onChange("instagram", e.target.value)}
            placeholder="https://instagram.com/yourpage"
            className="w-full px-4 py-3 border border-[#e8e6e3] focus-visible:border-[#8E7A6B] focus-visible:ring-2 focus-visible:ring-[#8E7A6B]/10 outline-none text-sm"
          />
        </div>
      </div>

      <button
        onClick={onSaveAction}
        disabled={saving || !shopName}
        className="bg-[#8E7A6B] text-white px-6 py-3 font-semibold hover:bg-[#7A6657] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-[#8E7A6B]/15"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Changes
      </button>
    </div>
  );
}
