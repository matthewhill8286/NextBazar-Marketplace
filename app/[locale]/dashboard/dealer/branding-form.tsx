"use client";

import { Loader2, Palette, Save } from "lucide-react";

export type BrandingState = {
  shopName: string;
  slug: string;
  description: string;
  accentColor: string;
  website: string;
  facebook: string;
  instagram: string;
};

type Props = {
  state: BrandingState;
  saving: boolean;
  onChange: <K extends keyof BrandingState>(key: K, value: BrandingState[K]) => void;
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

export default function BrandingForm({ state, saving, onChange, onSave }: Props) {
  const { shopName, slug, description, accentColor, website, facebook, instagram } = state;

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

      {/* Live preview strip */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${darkenHex(accentColor)})`,
        }}
      >
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {shopName
              ? shopName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "?"}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              {shopName || "Your Shop"}
            </div>
            <div className="text-white/60 text-xs">/shop/{slug || "..."}</div>
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
            onChange={(e) => onChange("shopName", e.target.value)}
            placeholder="Elite Motors"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Shop URL Slug
          </label>
          <div className="flex items-center gap-0">
            <span className="bg-gray-50 border border-r-0 border-gray-200 px-3 py-3 rounded-l-xl text-xs text-gray-400">
              /shop/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                onChange(
                  "slug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                )
              }
              placeholder="elite-motors"
              className="flex-1 px-4 py-3 rounded-r-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
            />
          </div>
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Shop Description
        </label>
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
        disabled={saving || !shopName || !slug}
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
