"use client";

import {
  Facebook,
  Globe,
  Instagram,
  Music,
  Search,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type ShopData = {
  shop_name: string;
  slug: string;
  logo_url: string | null;
  accent_color: string | null;
  description: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Standalone shop chrome — branded header + footer.
 * Replaces the main app's Navbar/Footer when rendered on a subdomain.
 */
export default function ShopShell({
  shop,
  children,
}: {
  shop: ShopData;
  children: ReactNode;
}) {
  const accent = shop.accent_color || "#4f46e5";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Branded header ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ backgroundColor: `${accent}f7`, borderColor: `${accent}33` }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo + name */}
          <Link href="/" className="flex items-center gap-3 group">
            {shop.logo_url ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/30">
                <Image
                  src={shop.logo_url}
                  alt={shop.shop_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/30"
                style={{ backgroundColor: accent }}
              >
                {getInitials(shop.shop_name)}
              </div>
            )}
            <span className="text-white font-bold text-lg tracking-tight group-hover:opacity-80 transition-opacity">
              {shop.shop_name}
            </span>
            <ShieldCheck className="w-4 h-4 text-white/70" />
          </Link>

          {/* Right side — search + powered by */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-white/70 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
            <a
              href={`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nextbazar.com"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/80 text-xs transition-colors hidden sm:block"
            >
              Powered by <span className="font-semibold">NextBazar</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Branded footer ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Shop info */}
            <div className="flex items-center gap-3">
              {shop.logo_url ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={shop.logo_url}
                    alt={shop.shop_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: accent }}
                >
                  {getInitials(shop.shop_name)}
                </div>
              )}
              <span className="text-gray-900 font-semibold">
                {shop.shop_name}
              </span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {shop.website && (
                <a
                  href={shop.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {shop.facebook && (
                <a
                  href={shop.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {shop.instagram && (
                <a
                  href={shop.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {shop.tiktok && (
                <a
                  href={shop.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-all"
                >
                  <Music className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Powered by */}
            <div className="text-xs text-gray-400">
              Powered by{" "}
              <a
                href={`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nextbazar.com"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
              >
                NextBazar
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
