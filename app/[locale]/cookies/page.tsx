import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslator } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Cookie Policy | NextBazar",
  description:
    "Learn about cookies and tracking technologies used by NextBazar. Manage your cookie preferences in accordance with EU regulations.",
};

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, "cookies");
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-6">
            {t("badge")}
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t("title")}
          </h1>
          <p className="text-lg text-[#6b6560] leading-relaxed">{t("intro")}</p>
          <p className="text-sm text-[#6b6560] mt-8">{t("lastUpdated")}</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-sm max-w-none">
          {/* What Are Cookies */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("whatAreCookies")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              {t("whatAreCookiesDesc")}
            </p>
          </div>

          {/* Why We Use Cookies */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("whyUseCookies")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("whyUseCookiesDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("cookiesLoggedIn")}</li>
              <li>• {t("cookiesPreferences")}</li>
              <li>• {t("cookiesUnderstand")}</li>
              <li>• {t("cookiesBrowsing")}</li>
              <li>• {t("cookiesDetect")}</li>
              <li>• {t("cookiesAnalyze")}</li>
              <li>• {t("cookiesRelevant")}</li>
            </ul>
          </div>

          {/* Types of Cookies */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("typesOfCookies")}
            </h2>

            {/* Essential */}
            <div className="mb-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("essentialCookies")}
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                {t("essentialCookiesDesc")}
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>{t("essentialSession")}</strong>
                </li>
                <li>
                  • <strong>{t("essentialSecurity")}</strong>
                </li>
                <li>
                  • <strong>{t("essentialPreferences")}</strong>
                </li>
                <li>
                  • <strong>{t("essentialCSRF")}</strong>
                </li>
              </ul>
              <p className="text-sm text-[#6b6560] mt-3">
                {t("essentialNote")}
              </p>
            </div>

            {/* Analytics */}
            <div className="mb-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("analyticsCookies")}
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                {t("analyticsCookiesDesc")}
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>{t("analyticsUsage")}</strong>
                </li>
                <li>
                  • <strong>{t("analyticsDevice")}</strong>
                </li>
                <li>
                  • <strong>{t("analyticsPerformance")}</strong>
                </li>
              </ul>
              <p className="text-sm text-[#6b6560] mt-3">
                <strong>{t("analyticsProvider")}</strong>
              </p>
            </div>

            {/* Preferences */}
            <div className="mb-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("preferenceCookies")}
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                {t("preferenceCookiesDesc")}
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>{t("preferenceLanguage")}</strong>
                </li>
                <li>
                  • <strong>{t("preferenceFilters")}</strong>
                </li>
                <li>
                  • <strong>{t("preferenceDisplay")}</strong>
                </li>
              </ul>
            </div>

            {/* Marketing */}
            <div>
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {t("marketingCookies")}
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                {t("marketingCookiesDesc")}
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>{t("marketingAdvertising")}</strong>
                </li>
                <li>
                  • <strong>{t("marketingSocial")}</strong>
                </li>
                <li>
                  • <strong>{t("marketingThirdParty")}</strong>
                </li>
              </ul>
              <p className="text-sm text-[#6b6560] mt-3">
                <strong>{t("marketingImportant")}</strong>
              </p>
            </div>
          </div>

          {/* {t("cookieDuration")} */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("cookieDuration")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("cookieDurationDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>
                • <strong>{t("durationSession")}</strong>
              </li>
              <li>
                • <strong>{t("durationPersistent")}</strong>
              </li>
              <li>
                • <strong>{t("durationEssential")}</strong>
              </li>
              <li>
                • <strong>{t("durationAnalytics")}</strong>
              </li>
            </ul>
          </div>

          {/* Your Privacy Rights */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("privacyRights")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("privacyRightsDesc")}
            </p>
            <ul className="space-y-3 text-[#6b6560]">
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("consentEssential")}</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("consentOther")}</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("consentManagement")}</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("consentWithdrawal")}</strong>
                </span>
              </li>
            </ul>
          </div>

          {/* Managing Cookies */}
          <div className="mb-12 bg-white border border-[#e8e6e3] p-8">
            <Settings className="w-6 h-6 text-[#8E7A6B] mb-4" />
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("manageCookies")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-6">
              {t("manageDesc")}
            </p>

            <h3 className="font-medium text-[#1a1a1a] mb-3 text-lg">
              {t("manageSite")}
            </h3>
            <p className="text-[#6b6560] leading-relaxed mb-6">
              {t("manageSiteDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-6">
              <li>• {t("manageAccept")}</li>
              <li>• {t("manageReject")}</li>
              <li>• {t("manageCustomize")}</li>
              <li>• {t("manageAccess")}</li>
            </ul>

            <h3 className="font-medium text-[#1a1a1a] mb-3 text-lg">
              {t("manageBrowser")}
            </h3>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("manageBrowserDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-6">
              <li>• {t("manageView")}</li>
              <li>• {t("manageBlock")}</li>
              <li>• {t("manageBlockThird")}</li>
              <li>• {t("manageDelete")}</li>
            </ul>
            <p className="text-sm text-[#6b6560] mb-6">
              {t("manageBrowserNote")}
            </p>

            <h3 className="font-medium text-[#1a1a1a] mb-3 text-lg">
              {t("manageDNT")}
            </h3>
            <p className="text-[#6b6560] leading-relaxed">
              {t("manageDNTDesc")}
            </p>
          </div>

          {/* Third-Party Links */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("thirdPartyWebsites")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              NextBazar may link to external websites and use third-party
              services (payment processors, analytics providers, social media
              platforms). These sites have their own cookie policies and privacy
              practices. NextBazar is not responsible for third-party cookies.
              Please review their policies when visiting external links.
            </p>
          </div>

          {/* Updates */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("updatesPolicy")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              NextBazar may update this Cookie Policy periodically to reflect
              changes in our cookie practices or applicable regulations. We will
              notify you of material changes by posting the updated policy here
              with a new "Last Updated" date. Your continued use of the platform
              after updates constitutes acceptance of the revised policy.
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12 bg-[#2C2826] p-8 md:p-12">
            <h2
              className="text-2xl font-light text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("questionsCookies")}
            </h2>
            <p className="text-white/60 leading-relaxed mb-4">
              {t("questionsDesc")}
            </p>
            <div className="bg-white/10 p-6 rounded-none border border-white/20">
              <p className="text-white mb-1">{t("privacyTeam")}</p>
              <p className="text-white/60 text-sm mb-4">{t("privacyEmail")}</p>
              <p className="text-white/60 text-sm">{t("cookieResponse")}</p>
            </div>
          </div>

          {/* Related */}
          <div className="bg-[#faf9f7] p-8 border border-[#e8e6e3]">
            <h3 className="font-medium text-[#1a1a1a] mb-4">
              {t("relatedPolicies")}
            </h3>
            <p className="text-[#6b6560] text-sm leading-relaxed">
              {t("relatedDesc")}{" "}
              <Link
                href="/privacy"
                className="text-[#8E7A6B] hover:text-[#7A6657] underline"
              >
                {t("privacyPolicy")}
              </Link>
              . {t("relatedTerms")}{" "}
              <Link
                href="/terms"
                className="text-[#8E7A6B] hover:text-[#7A6657] underline"
              >
                {t("termsOfService")}
              </Link>
              .
            </p>
          </div>

          {/* Footer Link */}
          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="text-[#8E7A6B] hover:text-[#7A6657] font-medium text-sm uppercase tracking-[0.1em]"
            >
              {t("needHelp")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
