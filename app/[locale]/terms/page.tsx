import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | NextBazar",
  description:
    "Read NextBazar's Terms of Service. By using our marketplace, you agree to these terms which are governed by Cyprus law.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Hero */}
      <section className="bg-white border-b border-[#e8e6e3]">
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
          <p className="text-[10px] font-medium tracking-[0.35em] uppercase text-[#6b6560] mb-6">
            Legal
          </p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Terms of Service
          </h1>
          <p className="text-lg text-[#6b6560] leading-relaxed">
            These Terms of Service govern your access to and use of NextBazar.
            By registering or using our platform, you agree to be bound by these
            terms.
          </p>
          <p className="text-sm text-[#6b6560] mt-8">
            Last updated: March 2026 • Cyprus Law Jurisdiction
          </p>
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
              1. Acceptance of Terms
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              By accessing and using NextBazar, you acknowledge that you have
              read, understood, and agree to be legally bound by these Terms of
              Service and our Privacy Policy. If you do not agree with any part
              of these terms, you may not use the platform. These terms are
              governed by and construed in accordance with the laws of the
              Republic of Cyprus, without regard to its conflict of law
              provisions.
            </p>
          </div>

          {/* Eligibility */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              2. Eligibility
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              To use NextBazar, you must:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• Be at least 18 years of age</li>
              <li>
                • Have the legal capacity to enter into binding agreements
              </li>
              <li>
                • Reside in Cyprus or be authorized to conduct business here
              </li>
              <li>• Not be prohibited from using online marketplaces by law</li>
              <li>• Provide accurate and complete registration information</li>
            </ul>
          </div>

          {/* Account Registration */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              3. Account Registration & Security
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              When you create a NextBazar account, you agree to:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• Provide accurate, current, and complete information</li>
              <li>• Maintain the confidentiality of your password</li>
              <li>• Notify us immediately of unauthorized access</li>
              <li>
                • Accept responsibility for all activities under your account
              </li>
              <li>• Use your account only for lawful purposes</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              NextBazar is not responsible for any loss or damage arising from
              your failure to maintain account security or from unauthorized
              access to your account.
            </p>
          </div>

          {/* Listing Rules */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              4. Listing Rules & Content Guidelines
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              When posting listings, you agree that all content must be:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• Accurate, truthful, and not misleading</li>
              <li>• Original content you own or have rights to use</li>
              <li>• Compliant with all applicable Cyprus and EU laws</li>
              <li>
                • Free from offensive, abusive, or discriminatory language
              </li>
              <li>• Not infringing on intellectual property rights</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              You retain ownership of your content but grant NextBazar a
              non-exclusive license to use, display, and distribute your
              listings on the platform.
            </p>
          </div>

          {/* Prohibited Items */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              5. Prohibited Items & Activities
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              You may not list or sell items or engage in activities that are:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• Illegal under Cyprus or international law</li>
              <li>• Counterfeit, stolen, or subject to legal claims</li>
              <li>• Weapons, explosives, or dangerous items</li>
              <li>
                • Drugs, alcohol, or tobacco (except age-restricted legal sales)
              </li>
              <li>• Wildlife products or endangered species</li>
              <li>• Human organs, blood, or biological materials</li>
              <li>• Fraudulent or deceptive in nature</li>
              <li>• Services for escort, sexual, or adult content</li>
              <li>• Hate speech, harassment, or defamatory content</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed mt-4">
              Violation of these rules may result in immediate removal of
              listings and account suspension.
            </p>
          </div>

          {/* User Conduct */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              6. User Conduct
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• Harass, threaten, or abuse other users</li>
              <li>• Engage in fraud, scams, or deceptive practices</li>
              <li>• Use automated tools to scrape or access the platform</li>
              <li>• Attempt to gain unauthorized access to systems</li>
              <li>• Interfere with platform functionality or security</li>
              <li>• Post spam, malware, or viruses</li>
              <li>• Engage in price fixing or manipulation</li>
            </ul>
          </div>

          {/* Liability Disclaimer */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              7. Liability Limitations
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              NextBazar provides the platform "as is" without warranties of any
              kind. We do not guarantee:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• The accuracy or quality of listings or user information</li>
              <li>• Uninterrupted or error-free platform operation</li>
              <li>• That transactions will be completed successfully</li>
              <li>• The honesty, reliability, or behavior of users</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              To the maximum extent permitted by Cyprus law, NextBazar shall not
              be liable for indirect, incidental, special, or consequential
              damages arising from your use of the platform or any transaction
              between users.
            </p>
            <p className="text-[#6b6560] leading-relaxed">
              NextBazar facilitates transactions between users but is not a
              party to transactions. We are not responsible for disputes,
              losses, or damages arising from transactions between buyers and
              sellers.
            </p>
          </div>

          {/* Dispute Resolution */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              8. Dispute Resolution
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              In case of disputes between users:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• Users agree to attempt good-faith resolution directly</li>
              <li>
                • NextBazar may provide a mediation service at our discretion
              </li>
              <li>• Disputes not resolved may proceed to Cyprus courts</li>
              <li>• Both parties agree to jurisdiction under Cyprus law</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              All disputes arising from these Terms shall be governed by the
              laws of the Republic of Cyprus and resolved exclusively in the
              courts of Cyprus.
            </p>
          </div>

          {/* Fees and Payments */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              9. Fees & Payments
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              NextBazar offers free listing for users. When fees are charged for
              premium features:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• Fees are clearly disclosed before purchase</li>
              <li>
                • Charges are processed securely through trusted payment
                providers
              </li>
              <li>• Refund policies are stated with each service offering</li>
              <li>
                • You are responsible for all charges incurred under your
                account
              </li>
            </ul>
          </div>

          {/* Termination */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              10. Termination
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              NextBazar may suspend or terminate your account:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-4">
              <li>• For violations of these Terms</li>
              <li>• For prohibited activities or illegal conduct</li>
              <li>• For repeated policy violations</li>
              <li>• At our sole discretion with or without notice</li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed">
              Upon termination, your right to use the platform ceases
              immediately. Active listings will be removed and any pending
              transactions may be cancelled.
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              11. Intellectual Property
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              All NextBazar platform content, design, functionality, and
              trademarks are the exclusive property of NextBazar or our
              licensors. You may not reproduce, modify, distribute, or transmit
              any NextBazar content without written permission. User-generated
              content (listings, reviews) remains the property of the user but
              is subject to our license to use and display it.
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="mb-12 bg-[#2C2826] p-8 md:p-12">
            <AlertCircle className="w-6 h-6 text-[#8E7A6B] mb-4" />
            <h2
              className="text-2xl font-light text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Changes to These Terms
            </h2>
            <p className="text-white/60 leading-relaxed">
              NextBazar reserves the right to modify these Terms at any time.
              Changes become effective when posted. Your continued use of the
              platform constitutes acceptance of modified terms. We recommend
              reviewing this page regularly for updates.
            </p>
          </div>

          {/* Footer Link */}
          <div className="mt-12 text-center">
            <p className="text-[#6b6560] mb-6">
              Questions about our Terms of Service?{" "}
              <Link
                href="/contact"
                className="text-[#8E7A6B] hover:text-[#7A6657] font-medium"
              >
                Get in touch
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
