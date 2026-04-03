import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslator } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Privacy Policy | NextBazar",
  description:
    "Learn how NextBazar protects your personal data and privacy. We comply with GDPR and Cyprus data protection regulations.",
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, "privacy");

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
          {/* Information We Collect */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("informationWeCollectTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("informationWeCollectDesc")}
            </p>
            <ul className="space-y-3 text-[#6b6560]">
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("accountInformationLabel")}:</strong>{" "}
                  {t("accountInformationDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("listingDataLabel")}:</strong>{" "}
                  {t("listingDataDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("communicationDataLabel")}:</strong>{" "}
                  {t("communicationDataDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("deviceInformationLabel")}:</strong>{" "}
                  {t("deviceInformationDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("usageDataLabel")}:</strong> {t("usageDataDesc")}
                </span>
              </li>
            </ul>
          </div>

          {/* How We Use Information */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("howWeUseInformationTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("howWeUseInformationDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("useProvideServices")}</li>
              <li>• {t("useProcessTransactions")}</li>
              <li>• {t("useSendTechnical")}</li>
              <li>• {t("useRespondComments")}</li>
              <li>• {t("useMonitorAnalyze")}</li>
              <li>• {t("useDetectFraud")}</li>
              <li>• {t("usePromotion")}</li>
              <li>• {t("useComplyLegal")}</li>
            </ul>
          </div>

          {/* Data Sharing */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("dataSharingTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("dataSharingDesc")}
            </p>
            <ul className="space-y-3 text-[#6b6560]">
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("serviceProvidersLabel")}:</strong>{" "}
                  {t("serviceProvidersDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("otherUsersLabel")}:</strong> {t("otherUsersDesc")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>{t("legalRequirementsLabel")}:</strong>{" "}
                  {t("legalRequirementsDesc")}
                </span>
              </li>
            </ul>
          </div>

          {/* Cookies and Tracking */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("cookiesAndTrackingTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              {t("cookiesAndTrackingDesc")}{" "}
              <Link
                href="/cookies"
                className="text-[#8E7A6B] hover:text-[#7A6657] underline"
              >
                {t("cookiePolicy")}
              </Link>
              .
            </p>
          </div>

          {/* Your Data Rights */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("yourDataRightsTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("yourDataRightsDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("rightAccess")}</li>
              <li>• {t("rightCorrection")}</li>
              <li>• {t("rightDeletion")}</li>
              <li>• {t("rightRestriction")}</li>
              <li>• {t("rightPortability")}</li>
              <li>• {t("rightObjection")}</li>
              <li>• {t("rightWithdrawConsent")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed mt-4">
              {t("exerciseRightsDesc")}
            </p>
          </div>

          {/* Data Security */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("dataSecurityTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              {t("dataSecurityDesc")}
            </p>
          </div>

          {/* Data Retention */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("dataRetentionTitle")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              {t("dataRetentionDesc")}
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12 bg-[#2C2826] p-8 md:p-12">
            <h2
              className="text-2xl font-light text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("contactTitle")}
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              {t("contactDesc")}
            </p>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#8E7A6B] mt-1 shrink-0" />
              <div>
                <p className="text-white mb-1">{t("privacyTeam")}</p>
                <p className="text-white/60 text-sm">{t("privacyEmail")}</p>
              </div>
            </div>
            <p className="text-white/60 text-sm mt-6">
              {t("privacyResponseTime")}
            </p>
          </div>

          {/* Footer Link */}
          <div className="text-center">
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
