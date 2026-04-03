import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslator } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Terms of Service | NextBazar",
  description:
    "Read NextBazar's Terms of Service. By using our marketplace, you agree to these terms which are governed by Cyprus law.",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale, "terms");

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
          {/* Acceptance */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("acceptance")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              {t("acceptanceDesc")}
            </p>
          </div>

          {/* Eligibility */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("eligibility")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("eligibilityDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("eligibilityAge")}</li>
              <li>• {t("eligibilityCapacity")}</li>
              <li>• {t("eligibilityResidence")}</li>
              <li>• {t("eligibilityProhibited")}</li>
              <li>• {t("eligibilityAccurate")}</li>
            </ul>
          </div>

          {/* Account Registration */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("accountRegistration")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("accountRegistrationDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• {t("accountAccurate")}</li>
              <li>• {t("accountPassword")}</li>
              <li>• {t("accountNotify")}</li>
              <li>• {t("accountResponsibility")}</li>
              <li>• {t("accountLawful")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              {t("accountSecurity")}
            </p>
          </div>

          {/* Listing Rules */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("listingRules")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("listingRulesDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• {t("listingAccurate")}</li>
              <li>• {t("listingOwned")}</li>
              <li>• {t("listingCompliant")}</li>
              <li>• {t("listingOffensive")}</li>
              <li>• {t("listingIP")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              {t("listingOwnership")}
            </p>
          </div>

          {/* Prohibited Items */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("prohibitedItems")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("prohibitedItemsDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("prohibitedIllegal")}</li>
              <li>• {t("prohibitedCounterfeit")}</li>
              <li>• {t("prohibitedWeapons")}</li>
              <li>• {t("prohibitedDrugs")}</li>
              <li>• {t("prohibitedWildlife")}</li>
              <li>• {t("prohibitedOrgans")}</li>
              <li>• {t("prohibitedFraud")}</li>
              <li>• {t("prohibitedAdult")}</li>
              <li>• {t("prohibitedHate")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed mt-4">
              {t("prohibitedViolation")}
            </p>
          </div>

          {/* User Conduct */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("userConduct")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("userConductDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("conductHarass")}</li>
              <li>• {t("conductFraud")}</li>
              <li>• {t("conductAutomated")}</li>
              <li>• {t("conductUnauthorized")}</li>
              <li>• {t("conductInterfere")}</li>
              <li>• {t("conductSpam")}</li>
              <li>• {t("conductPrice")}</li>
            </ul>
          </div>

          {/* Liability Disclaimer */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("liabilityLimitations")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("liabilityDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• {t("liabilityAccuracy")}</li>
              <li>• {t("liabilityUninterrupted")}</li>
              <li>• {t("liabilityCompletion")}</li>
              <li>• {t("liabilityHonesty")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("liabilityIndirect")}
            </p>
            <p className="text-[#6b6560] leading-relaxed">
              {t("liabilityFacilitates")}
            </p>
          </div>

          {/* Dispute Resolution */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("disputeResolution")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("disputeResolutionDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• {t("disputeGoodFaith")}</li>
              <li>• {t("disputeMediation")}</li>
              <li>• {t("disputeProceeds")}</li>
              <li>• {t("disputeJurisdiction")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              {t("disputeGoverned")}
            </p>
          </div>

          {/* Fees and Payments */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("feesAndPayments")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("feesDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• {t("feesDisclosed")}</li>
              <li>• {t("feesCharged")}</li>
              <li>• {t("feesRefund")}</li>
              <li>• {t("feesResponsible")}</li>
            </ul>
          </div>

          {/* Termination */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("termination")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              {t("terminationDesc")}
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• {t("terminationViolations")}</li>
              <li>• {t("terminationProhibited")}</li>
              <li>• {t("terminationRepeated")}</li>
              <li>• {t("terminationDiscretionary")}</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              {t("terminationCease")}
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("intellectualProperty")}
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              {t("intellectualPropertyDesc")}
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="mb-12 bg-[#2C2826] p-8 md:p-12">
            <AlertCircle className="w-6 h-6 text-[#8E7A6B] mb-4" />
            <h2
              className="text-2xl font-light text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("changesTerms")}
            </h2>
            <p className="text-white/60 leading-relaxed">
              {t("changesTermsDesc")}
            </p>
          </div>

          {/* Footer Link */}
          <div className="mt-12 text-center">
            <p className="text-[#6b6560] mb-6">
              {t("questionsTerms")}{" "}
              <Link
                href="/contact"
                className="text-[#8E7A6B] hover:text-[#7A6657] font-medium"
              >
                {t("getInTouch")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
