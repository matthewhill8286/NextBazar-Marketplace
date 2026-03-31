import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | NextBazar",
  description:
    "Learn how NextBazar protects your personal data and privacy. We comply with GDPR and Cyprus data protection regulations.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-lg text-[#6b6560] leading-relaxed">
            At NextBazar, we believe privacy is fundamental. This policy
            explains how we collect, use, and protect your personal data in
            compliance with GDPR and Cyprus data protection law.
          </p>
          <p className="text-sm text-[#6b6560] mt-8">
            Last updated: March 2026
          </p>
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
              Information We Collect
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              We collect information you provide directly and information
              collected automatically when you use NextBazar:
            </p>
            <ul className="space-y-3 text-[#6b6560]">
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Account Information:</strong> Name, email address,
                  phone number, payment information, and profile details when
                  you register or post listings.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Listing Data:</strong> Photos, descriptions, location,
                  category, and pricing information for items you list.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Communication Data:</strong> Messages, reviews, and
                  ratings between buyers and sellers.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Device Information:</strong> IP address, browser type,
                  device type, and operating system.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Usage Data:</strong> Pages visited, search queries,
                  time spent on the platform, and other activity analytics.
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
              How We Use Information
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• Provide, maintain, and improve NextBazar services</li>
              <li>• Process transactions and send related information</li>
              <li>• Send technical notices and support messages</li>
              <li>• Respond to your comments and questions</li>
              <li>• Monitor and analyze trends and usage patterns</li>
              <li>• Detect, prevent, and address fraud and security issues</li>
              <li>• Send promotional communications (with your consent)</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </div>

          {/* Data Sharing */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Data Sharing
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              We do not sell your personal data. We may share information with:
            </p>
            <ul className="space-y-3 text-[#6b6560]">
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Service Providers:</strong> Payment processors,
                  hosting providers, and analytics services who help operate the
                  platform.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Other Users:</strong> Your name, profile picture, and
                  listing information are visible to other NextBazar users.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights and safety.
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
              Cookies and Tracking
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              We use cookies and similar tracking technologies to enhance your
              experience. For detailed information about our cookie practices,
              please visit our{" "}
              <Link
                href="/cookies"
                className="text-[#8E7A6B] hover:text-[#7A6657] underline"
              >
                Cookie Policy
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
              Your Data Rights (GDPR & Cyprus Law)
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              Under GDPR and Cyprus data protection regulations, you have the
              right to:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>
                • <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                • <strong>Correction:</strong> Request we correct inaccurate
                information
              </li>
              <li>
                • <strong>Deletion:</strong> Request deletion of your data
                ("right to be forgotten")
              </li>
              <li>
                • <strong>Restriction:</strong> Request we limit how we use your
                data
              </li>
              <li>
                • <strong>Portability:</strong> Receive your data in a portable
                format
              </li>
              <li>
                • <strong>Objection:</strong> Object to processing for direct
                marketing
              </li>
              <li>
                • <strong>Withdraw Consent:</strong> Withdraw consent at any
                time
              </li>
            </ul>
            <p className="text-[#6b6560] leading-relaxed mt-4">
              To exercise any of these rights, please contact us using the
              details below.
            </p>
          </div>

          {/* Data Security */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Data Security
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, and destruction. However, no method of transmission
              over the internet is completely secure. We cannot guarantee
              absolute security, but we are committed to protecting your
              information.
            </p>
          </div>

          {/* Data Retention */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Data Retention
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              We retain your personal data for as long as necessary to provide
              our services, comply with legal obligations, and resolve disputes.
              Account information is retained for the duration of your account
              and for a reasonable period afterward for legal compliance.
            </p>
          </div>

          {/* Contact */}
          <div className="mb-12 bg-[#2C2826] p-8 md:p-12">
            <h2
              className="text-2xl font-light text-white mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Questions About Your Privacy?
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              If you have concerns about our privacy practices or wish to
              exercise your data rights, please contact our Data Protection
              Officer:
            </p>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#8E7A6B] mt-1 shrink-0" />
              <div>
                <p className="text-white mb-1">NextBazar Privacy Team</p>
                <p className="text-white/60 text-sm">privacy@nextbazar.cy</p>
              </div>
            </div>
            <p className="text-white/60 text-sm mt-6">
              We will respond to all privacy requests within 30 days as required
              by law.
            </p>
          </div>

          {/* Footer Link */}
          <div className="text-center">
            <Link
              href="/contact"
              className="text-[#8E7A6B] hover:text-[#7A6657] font-medium text-sm uppercase tracking-[0.1em]"
            >
              Need Help? Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
