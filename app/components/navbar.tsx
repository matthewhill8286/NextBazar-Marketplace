"use client";

import { Plus, Search, Store } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import GlobalSearch from "./global-search";
import type { CategoryChip, TrendingItem } from "./global-search";
import NavBadges from "./nav-badges";
import UserMenu from "./user-menu";

export default function Navbar({
  categories,
  trending,
  badgesSlot,
}: {
  categories?: CategoryChip[];
  trending?: TrendingItem[];
  /**
   * Optional server-rendered badges node. When provided, the layout has
   * already SSR'd initial unread counts so there are no extra client-side
   * round trips on first paint. When omitted we fall back to the
   * client-only <NavBadges /> which will lazily fetch.
   */
  badgesSlot?: ReactNode;
} = {}) {
  const t = useTranslations("nav");

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#e8e6e3]/60"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/nextbazar-logo-beta.svg"
            alt="NextBazar"
            width={180}
            height={55}
            style={{ width: 180, height: 55 }}
            priority
            className="hidden md:block h-9 w-auto"
          />
          <Image
            src="/nextbazar-icon.svg"
            alt="NextBazar"
            width={40}
            height={40}
            style={{ width: 40, height: 40 }}
            priority
            className="md:hidden h-9 w-9"
          />
        </Link>

        {/* Global search */}
        <GlobalSearch initialCategories={categories} initialTrending={trending} />

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {FEATURE_FLAGS.DEALERS && (
            <Link
              href="/shops"
              className="hidden md:flex items-center gap-1.5 text-xs text-[#666] hover:text-[#1a1a1a] px-3 py-2 transition-colors font-medium tracking-wide"
            >
              <Store className="w-4 h-4" />
              <span>{t("shops")}</span>
            </Link>
          )}

          <Link
            href="/search"
            aria-label="Search listings"
            className="md:hidden p-2.5 text-[#6b6560] hover:text-[#1a1a1a] transition-colors"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </Link>

          {badgesSlot ?? <NavBadges />}

          {/* Post-Ad CTA */}
          <Link
            href="/post"
            className="bg-[#8E7A6B] text-white px-5 py-2.5 text-[10px] font-medium tracking-[0.15em] uppercase hover:bg-[#7A6657] transition-colors flex items-center gap-2 ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("postAd")}</span>
          </Link>

          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
