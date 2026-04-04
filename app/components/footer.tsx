"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[#2C2826] text-[#666] mt-24">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3
              className="text-white text-xl font-light mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Stay in the loop
            </h3>
            <p className="text-[11px] text-white/60 tracking-wide">
              New listings, deals, and marketplace updates.
            </p>
          </div>
          <div className="flex gap-0 w-full md:w-auto">
            <label htmlFor="footer-newsletter" className="sr-only">
              Email address for newsletter
            </label>
            <input
              id="footer-newsletter"
              type="email"
              placeholder="Your email"
              aria-label="Email address for newsletter"
              className="bg-white/5 border border-white/10 text-white text-sm px-5 py-3 w-full md:w-72 placeholder:text-white/40 outline-none focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/10 transition-colors"
            />
            <button className="bg-white text-[#1a1a1a] px-6 py-3 text-[10px] font-medium tracking-[0.2em] uppercase hover:bg-[#f0eeeb] transition-colors shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-5">
              <Image
                src="/nextbazar-logo-dark.svg"
                alt="NextBazar"
                width={120}
                height={32}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </Link>
            <p className="text-xs leading-relaxed text-[#555] max-w-[200px]">
              {t("tagline")}
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/60 mb-5">
              {t("marketplace")}
            </p>
            <ul className="space-y-3 text-sm">
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
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/60 mb-5">
              {t("account")}
            </p>
            <ul className="space-y-3 text-sm">
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
                  href="/dashboard/messages"
                  className="hover:text-white transition-colors"
                >
                  {t("messages")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/saved"
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
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-white/60 mb-5">
              {t("company")}
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="hover:text-white transition-colors"
                >
                  {t("safetyTips")}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              {FEATURE_FLAGS.DEALERS_PAGE && (
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    {t("forDealers")}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[10px] text-[#444] tracking-wider">
            {t("rights")}
          </p>
          <div className="flex gap-6 text-[10px] text-[#444] tracking-wider">
            <Link
              href="/privacy"
              className="hover:text-[#888] transition-colors"
            >
              {t("privacy")}
            </Link>
            <Link href="/terms" className="hover:text-[#888] transition-colors">
              {t("terms")}
            </Link>
            <Link
              href="/cookies"
              className="hover:text-[#888] transition-colors"
            >
              {t("cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
