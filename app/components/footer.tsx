"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-gray-950 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Link href="/">
                <Image
                  src="/nextbazar-logo-dark.svg"
                  alt="NextBazar"
                  width={160}
                  height={40}
                  priority
                />
              </Link>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-[200px]">
              {t("tagline")}
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">
              {t("marketplace")}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/search"
                  className="hover:text-white transition-colors"
                >
                  {t("browseListings")}
                </Link>
              </li>
              <li>
                <Link
                  href="/post"
                  className="hover:text-white transition-colors"
                >
                  {t("postAd")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search?sort=newest"
                  className="hover:text-white transition-colors"
                >
                  {t("recentlyAdded")}
                </Link>
              </li>
              <li>
                <Link
                  href="/search?promoted=true"
                  className="hover:text-white transition-colors"
                >
                  {t("featuredListings")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">
              {t("account")}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-white transition-colors"
                >
                  {t("myListings")}
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  className="hover:text-white transition-colors"
                >
                  {t("messages")}
                </Link>
              </li>
              <li>
                <Link
                  href="/saved"
                  className="hover:text-white transition-colors"
                >
                  {t("savedItems")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/settings"
                  className="hover:text-white transition-colors"
                >
                  {t("settings")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">
              {t("company")}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition-colors">
                  {t("safetyTips")}
                </Link>
              </li>
              <li>
                <Link href="/dealers" className="hover:text-white transition-colors">
                  {t("forDealers")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-600">{t("rights")}</p>
          <div className="flex gap-5 text-xs text-gray-600">
            <Link href="/" className="hover:text-gray-400 transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">
              {t("terms")}
            </Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">
              {t("cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
