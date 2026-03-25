"use client";

import {
  Check,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  Palette,
  Save,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type DealerShop = Tables<"dealer_shops">;

type Props = {
  userId: string;
};

export default function MyShopTab({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<DealerShop | null>(null);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Branding form state
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState("#4f46e5");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");

  // ─── Load shop data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("dealer_shops")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data) {
        setShop(data);
        setShopName(data.shop_name ?? "");
        setSlug(data.slug ?? "");
        setDescription(data.description ?? "");
        setAccentColor(data.accent_color ?? "#4f46e5");
        setWebsite(data.website ?? "");
        setFacebook(data.facebook ?? "");
        setInstagram(data.instagram ?? "");
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  // ─── Post-checkout verification ──────────────────────────────────────────
  useEffect(() => {
    const isSetup = searchParams.get("setup") === "true";
    const sessionId = searchParams.get("session_id");

    if (isSetup && sessionId && !shop?.plan_status) {
      setVerifying(true);
      fetch("/api/dealer/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "activated" || data.status === "already_active") {
            toast.success("Welcome to Pro Seller!", {
              description: "Your account has been activated.",
            });
            router.refresh();
          }
        })
        .catch(() => {
          toast.error("Verification failed", {
            description: "We couldn't verify your subscription. Please refresh the page.",
          });
        })
        .finally(() => setVerifying(false));
    }
  }, [searchParams, shop?.plan_status, router]);

  const isActive = shop?.plan_status === "active";

  // ─── Subscribe ────────────────────────────────────────────────────────────
  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/dealer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Something went wrong", {
          description: data.error || "Could not start checkout",
        });
        setSubscribing(false);
      }
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
      setSubscribing(false);
    }
  }

  // ─── Manage billing ──────────────────────────────────────────────────────
  async function handleManageBilling() {
    try {
      const res = await fetch("/api/dealer/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not open billing portal", {
          description: data.error || "Please try again later.",
        });
      }
    } catch {
      toast.error("Network error", {
        description: "Could not reach the server. Please try again.",
      });
    }
  }

  // ─── Save branding ──────────────────────────────────────────────────────
  async function handleSaveBranding() {
    if (!shop) return;
    setSaving(true);
    const { error } = await supabase
      .from("dealer_shops")
      .update({
        shop_name: shopName,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description,
        accent_color: accentColor,
        website: website || null,
        facebook: facebook || null,
        instagram: instagram || null,
      })
      .eq("id", shop.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to save changes", {
        description: error.message,
      });
    } else {
      toast.success("Shop branding updated");
      router.refresh();
    }
  }

  function copyShopUrl() {
    const url = `${window.location.origin}/shop/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // ─── Verifying post-checkout ─────────────────────────────────────────────
  if (verifying) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Setting up your Pro Seller account...
        </h2>
        <p className="text-gray-500">This only takes a moment.</p>
      </div>
    );
  }

  // ─── Not subscribed — show CTA ──────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)",
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Become a Pro Seller</h1>
            <p className="text-white/75 text-lg mb-2 max-w-md mx-auto">
              Everything you need to grow your business on NextBazar.
            </p>
            <div className="text-4xl font-extrabold my-6">
              &euro;35
              <span className="text-lg font-medium text-white/50">/month</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 max-w-md mx-auto">
              {[
                "Unlimited listings",
                "Branded shop page",
                "Custom logo & banner",
                "Accent colour theming",
                "Verified Pro Seller badge",
                "Analytics dashboard",
                "Inventory management",
                "Bulk edit tools",
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-white/90"
                >
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-300" />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-black/10 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {subscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active Pro Seller — shop setup & branding ──────────────────────────
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}25)`,
            }}
          >
            <Store className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {shopName || "Your Shop"}
            </h2>
            <p className="text-xs text-gray-500">
              Configure your shop branding and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/shop/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Shop
          </Link>
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing
          </button>
        </div>
      </div>

      {/* Shop URL */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Your Shop URL
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-mono truncate border border-gray-100">
            {typeof window !== "undefined" ? window.location.origin : ""}
            /shop/{slug}
          </div>
          <button
            onClick={copyShopUrl}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Branding form */}
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
            background: `linear-gradient(135deg, ${accentColor}, ${
              /^#[0-9A-Fa-f]{6}$/.test(accentColor)
                ? (() => {
                    const num = parseInt(accentColor.replace("#", ""), 16);
                    const amt = Math.round(2.55 * -25);
                    const clamp = (v: number) =>
                      Math.max(0, Math.min(255, v));
                    const R = clamp((num >> 16) + amt);
                    const G = clamp(((num >> 8) & 0xff) + amt);
                    const B = clamp((num & 0xff) + amt);
                    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
                  })()
                : "#4338ca"
            })`,
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
              onChange={(e) => setShopName(e.target.value)}
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
                  setSlug(
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
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
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
              onChange={(e) => setWebsite(e.target.value)}
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
            onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setFacebook(e.target.value)}
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
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourpage"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSaveBranding}
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
    </div>
  );
}
