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
  Sparkles, Store,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

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
  onBannerUpload: (file: File) => void;
  onBannerRemove: () => void;
  onSave: () => void;
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
  onBannerUpload,
  onBannerRemove,
  onSave,
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
    onBannerUpload(file);
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
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" />
          Shop Branding
        </h3>
        <p className="text-sm text-gray-500">
          Customise how your shop appears to buyers.
        </p>
      </div>

      {/* Banner upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Shop Banner
        </label>

        {/* Drop zone — shown when no banner */}
        {!bannerUrl && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => bannerInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white ${
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-400"
            }`}
          >
            {bannerUploading ? (
              <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            )}
            <p className="font-semibold text-gray-900 mb-1">Upload Banner</p>
            <p className="text-sm text-gray-500">
              Drag & drop or click to browse. JPG, PNG, WebP — recommended 1200
              x 300px.
            </p>
          </div>
        )}

        {/* Banner preview — shown when banner exists */}
        {bannerUrl && (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
            <Image
              src={bannerUrl}
              alt="Shop banner"
              width={1200}
              height={300}
              className="w-full h-44 object-cover"
            />

            {/* Uploading overlay */}
            {bannerUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}

            {/* Change banner — click whole image */}
            {!bannerUploading && (
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Change Banner
                </span>
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBannerRemove();
              }}
              className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleBannerSelect}
        />
      </div>

      {/* ── Live shop preview — mirrors /shop/[slug] ──────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Shop Preview
          </label>
          {slug && (
            <Link
              href={`/shop/${slug}`}
              target="_blank"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View live shop
            </Link>
          )}
        </div>
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
          {/* Hero banner */}
          <div className="relative">
            <div
              className="h-36 sm:h-44 w-full overflow-hidden"
              style={{
                backgroundImage: bannerUrl
                  ? `url(${bannerUrl})`
                  : `linear-gradient(135deg, ${accentColor} 0%, ${darkenHex(accentColor)} 50%, ${darkenHex(darkenHex(accentColor))} 100%)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {bannerUrl && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
              )}
              {!bannerUrl && (
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
          </div>

          {/* Shop info card */}
          <div className="mx-3 -mt-10 relative z-10">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div
                    className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-md shrink-0 -mt-10"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${darkenHex(accentColor)})`,
                      }}
                    >
                      {shopName
                        ? shopName
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
                      <h3 className="text-lg font-bold text-gray-900 truncate">
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
                      <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
                        {description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-300 italic mb-3">
                        Add a description to tell buyers about your business...
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                        /shop/{slug || "..."}
                      </span>
                      {website && (
                        <span className="p-1.5 rounded-lg bg-gray-50">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                      )}
                      {facebook && (
                        <span className="p-1.5 rounded-lg bg-gray-50">
                          <Facebook className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                      )}
                      {instagram && (
                        <span className="p-1.5 rounded-lg bg-gray-50">
                          <Instagram className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div className="border-t border-gray-100 bg-gray-50/50">
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  <div className="text-center py-3 px-3">
                    <div className="text-lg font-bold text-gray-900">0</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                      Active Listings
                    </div>
                  </div>
                  <div className="text-center py-3 px-3">
                    <div className="text-lg font-bold text-gray-900">0</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                      Total Views
                    </div>
                  </div>
                  <div className="text-center py-3 px-3">
                    <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                      <ShieldCheck
                        className="w-4 h-4"
                        style={{ color: accentColor }}
                      />
                      PRO
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 font-medium">
                      Seller Status
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty listings area */}
          <div className="mx-3 mt-3 mb-3">
            <div className="bg-white rounded-2xl border border-gray-100 py-8 text-center">
              <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-900 mb-1">
                No listings yet
              </p>
              <p className="text-xs text-gray-500">
                Listings will appear here once posted.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shop Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Accent Colour
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onChange("accentColor", e.target.value)}
              className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => onChange("accentColor", e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Website{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://www.example.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Shop Description
          </label>
          <button
            type="button"
            onClick={handleAiWrite}
            disabled={aiWriting || !shopName}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded-full font-semibold uppercase tracking-wider">
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
        />
      </div>

      {/* Social Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Facebook
          </label>
          <input
            type="text"
            value={facebook}
            onChange={(e) => onChange("facebook", e.target.value)}
            placeholder="https://facebook.com/yourpage"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Instagram
          </label>
          <input
            type="text"
            value={instagram}
            onChange={(e) => onChange("instagram", e.target.value)}
            placeholder="https://instagram.com/yourpage"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving || !shopName}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-indigo-200"
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
