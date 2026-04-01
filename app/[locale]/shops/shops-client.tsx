"use client";

import { ArrowRight, Check, Package, Search, Store } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { ShopCardRow } from "@/lib/supabase/queries";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/** Darken or lighten a hex colour by `percent` (-100..100). */
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

type SortOption = "listings" | "newest" | "name";

interface ShopsClientProps {
  shops: ShopCardRow[];
}

export default function ShopsClient({ shops }: ShopsClientProps) {
  const t = useTranslations("shops");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("listings");

  const filtered = useMemo(() => {
    let result = [...shops];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.shop_name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case "listings":
        result.sort((a, b) => b.listing_count - a.listing_count);
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "name":
        result.sort((a, b) => a.shop_name.localeCompare(b.shop_name));
        break;
    }

    return result;
  }, [shops, search, sort]);

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="bg-[#faf9f7] border-b border-[#e8e6e3]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#8E7A6B] mb-4 flex items-center justify-center gap-2">
              <Store className="w-3.5 h-3.5" />
              {t("badge")}
            </p>
            <h1
              className="text-3xl md:text-5xl font-light text-[#1a1a1a] mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("title")}
            </h1>
            <p className="text-[#6b6560] text-base md:text-lg max-w-xl mx-auto mb-10">
              {t("subtitle")}
            </p>

            {/* Search bar */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a8280] pointer-events-none" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-[#e8e6e3] bg-white text-sm text-[#1a1a1a] placeholder:text-[#8a8280] focus:outline-none focus-visible:border-[#8E7A6B] focus:ring-1 focus:ring-[#8E7A6B]/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#6b6560]">
            {t("shopCount", { count: filtered.length })}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-2 border border-[#e8e6e3] bg-white text-sm text-[#666] focus:outline-none focus-visible:border-[#8E7A6B] cursor-pointer"
          >
            <option value="listings">{t("sortListings")}</option>
            <option value="newest">{t("sortNewest")}</option>
            <option value="name">{t("sortName")}</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((shop) => (
              <ShopCard key={shop.id} shop={shop} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border border-[#e8e6e3]">
            <div className="w-14 h-14 bg-[#f0eeeb] flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-[#8E7A6B]" />
            </div>
            <h2
              className="text-xl font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {search.trim() ? t("noShopsFound") : t("noShopsYet")}
            </h2>
            <p className="text-[#6b6560] max-w-sm mx-auto text-sm">
              {search.trim() ? t("noShopsFoundDesc") : t("noShopsYetDesc")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Individual Shop Card ─────────────────────────────────────────────────── */

function ShopCard({ shop, locale }: { shop: ShopCardRow; locale: string }) {
  const t = useTranslations("shops");
  const accentColor = shop.accent_color || "#8E7A6B";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(accentColor);
  const gradientStart = isValidHex ? accentColor : "#8E7A6B";
  const gradientEnd = isValidHex
    ? adjustBrightness(accentColor, -25)
    : "#7A6657";

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group block bg-white border border-[#e8e6e3] overflow-hidden hover:shadow-sm hover:shadow-[#e8e6e3]/60 hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Banner container */}
      <div className="relative">
        {/* Banner */}
        {shop.banner_url ? (
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              src={shop.banner_url}
              alt={shop.shop_name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        ) : (
          <div
            className="relative h-36 w-full overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
            }}
          />
        )}

        {/* Listing count badge on banner */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#666] text-xs font-medium px-2.5 py-1 shadow-sm">
            <Package className="w-3 h-3" />
            {shop.listing_count}
          </span>
        </div>

        {/* Logo overlay */}
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 overflow-hidden border-[3px] border-white shadow-md bg-white">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.shop_name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-lg font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                }}
              >
                {getInitials(shop.shop_name)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-5 px-5">
        {/* Name + verified */}
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-base font-semibold text-[#1a1a1a] truncate group-hover:text-[#8E7A6B] transition-colors">
            {shop.shop_name}
          </h3>
          {shop.profile?.verified && (
            <span
              className="shrink-0 flex items-center justify-center w-5 h-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              }}
              title={t("verifiedProSeller")}
            >
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Description */}
        {shop.description ? (
          <p className="text-sm text-[#6b6560] line-clamp-2 mb-4 leading-relaxed">
            {shop.description}
          </p>
        ) : (
          <div className="mb-4" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-[#8a8280]">
            <span className="font-medium">
              {t("listingCount", { count: shop.listing_count })}
            </span>
            <span className="w-1 h-1 bg-[#ccc]" />
            <span>
              {t("joined", {
                date: new Date(shop.created_at).toLocaleDateString(
                  locale === "el"
                    ? "el-GR"
                    : locale === "ru"
                      ? "ru-RU"
                      : "en-US",
                  { month: "short", year: "numeric" },
                ),
              })}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8a8280] group-hover:text-[#8E7A6B] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

/* ── Compact card for homepage featured section ───────────────────────────── */

export function ShopCardCompact({ shop }: { shop: ShopCardRow }) {
  const t = useTranslations("shops");
  const accentColor = shop.accent_color || "#8E7A6B";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(accentColor);
  const gradientStart = isValidHex ? accentColor : "#8E7A6B";
  const gradientEnd = isValidHex
    ? adjustBrightness(accentColor, -25)
    : "#7A6657";

  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="group block bg-white border border-[#e8e6e3] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Mini banner */}
      {shop.banner_url ? (
        <div className="relative h-20 w-full overflow-hidden">
          <Image
            src={shop.banner_url}
            alt={shop.shop_name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      ) : (
        <div
          className="relative h-20 w-full"
          style={{
            background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative px-4 pb-4 pt-7">
        {/* Logo */}
        <div className="absolute -top-6 left-4">
          <div className="w-12 h-12 overflow-hidden border-2 border-white shadow-sm bg-white">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.shop_name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                }}
              >
                {getInitials(shop.shop_name)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-sm font-semibold text-[#1a1a1a] truncate group-hover:text-[#8E7A6B] transition-colors">
            {shop.shop_name}
          </h3>
          {shop.profile?.verified && (
            <span
              className="shrink-0 flex items-center justify-center w-4 h-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              }}
            >
              <Check className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#8a8280] font-medium">
          <Package className="w-3 h-3" />
          {t("listingCount", { count: shop.listing_count })}
        </div>
      </div>
    </Link>
  );
}
