import { Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | NextBazar",
  description:
    "Learn about cookies and tracking technologies used by NextBazar. Manage your cookie preferences in accordance with EU regulations.",
};

export default function CookiesPage() {
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
            Cookie Policy
          </h1>
          <p className="text-lg text-[#6b6560] leading-relaxed">
            This Cookie Policy explains how NextBazar uses cookies and similar
            technologies to enhance your browsing experience while respecting
            your privacy and complying with EU cookie regulations.
          </p>
          <p className="text-sm text-[#6b6560] mt-8">
            Last updated: March 2026
          </p>
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
              What Are Cookies?
            </h2>
            <p className="text-[#6b6560] leading-relaxed">
              Cookies are small text files stored on your device when you visit
              a website. They contain information that helps websites recognize
              your device and remember your preferences. Cookies are essential
              for many online services and help provide a better user
              experience. Similar tracking technologies include web beacons,
              pixels, and local storage.
            </p>
          </div>

          {/* Why We Use Cookies */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Why We Use Cookies
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              We use cookies to:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>• Keep you logged in securely</li>
              <li>• Remember your preferences and settings</li>
              <li>• Understand how you use our platform</li>
              <li>• Improve your browsing experience</li>
              <li>• Detect and prevent fraud and security threats</li>
              <li>• Analyze platform performance and user behavior</li>
              <li>• Show you relevant content and personalized features</li>
            </ul>
          </div>

          {/* Types of Cookies */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Types of Cookies We Use
            </h2>

            {/* Essential */}
            <div className="mb-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                1. Essential Cookies
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                These cookies are necessary for the platform to function
                properly. They enable core functionality like login, account
                security, and basic navigation.
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>Session ID:</strong> Maintains your login session
                </li>
                <li>
                  • <strong>Security:</strong> Prevents unauthorized access
                </li>
                <li>
                  • <strong>Preferences:</strong> Saves language and basic
                  settings
                </li>
                <li>
                  • <strong>CSRF Protection:</strong> Prevents cross-site
                  attacks
                </li>
              </ul>
              <p className="text-sm text-[#6b6560] mt-3">
                These cookies are always active and cannot be disabled without
                breaking platform functionality.
              </p>
            </div>

            {/* Analytics */}
            <div className="mb-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                2. Analytics Cookies
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                These cookies help us understand how users interact with
                NextBazar. We use this information to improve features, fix
                bugs, and optimize performance.
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>Usage Data:</strong> Pages visited, time on site,
                  search queries
                </li>
                <li>
                  • <strong>Device Info:</strong> Browser type, device,
                  operating system
                </li>
                <li>
                  • <strong>Performance:</strong> Page load times and feature
                  usage
                </li>
              </ul>
              <p className="text-sm text-[#6b6560] mt-3">
                <strong>Provider:</strong> Google Analytics (anonymized)
              </p>
            </div>

            {/* Preferences */}
            <div className="mb-8">
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                3. Preference Cookies
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                These cookies remember your preferences to personalize your
                experience, such as language choice, UI customizations, and
                saved searches.
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>Language:</strong> Your preferred language
                </li>
                <li>
                  • <strong>Search Filters:</strong> Recently used categories
                  and locations
                </li>
                <li>
                  • <strong>Display Settings:</strong> UI preferences and themes
                </li>
              </ul>
            </div>

            {/* Marketing */}
            <div>
              <h3
                className="text-lg font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                4. Marketing & Third-Party Cookies
              </h3>
              <p className="text-[#6b6560] leading-relaxed mb-3">
                These cookies are used to track your behavior across websites
                and serve you with relevant advertisements. Third-party partners
                may also place cookies on our platform.
              </p>
              <ul className="space-y-2 text-[#6b6560] text-sm">
                <li>
                  • <strong>Advertising:</strong> Shows relevant ads based on
                  interests
                </li>
                <li>
                  • <strong>Social Media:</strong> Enables social sharing
                  features
                </li>
                <li>
                  • <strong>Third-Party Partners:</strong> Payment processors,
                  analytics tools
                </li>
              </ul>
              <p className="text-sm text-[#6b6560] mt-3">
                <strong>Important:</strong> Marketing cookies require your
                explicit consent and can be disabled.
              </p>
            </div>
          </div>

          {/* Cookie Duration */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Cookie Duration
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              Cookies have different lifespans:
            </p>
            <ul className="space-y-2 text-[#6b6560]">
              <li>
                • <strong>Session Cookies:</strong> Expire when you close your
                browser
              </li>
              <li>
                • <strong>Persistent Cookies:</strong> Remain on your device for
                months or years
              </li>
              <li>
                • <strong>Essential Cookies:</strong> Usually expire after 1-2
                years
              </li>
              <li>
                • <strong>Analytics Cookies:</strong> Typically expire after 13
                months
              </li>
            </ul>
          </div>

          {/* Your Privacy Rights */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Privacy Rights & Consent
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              Under EU cookie regulations (ePrivacy Directive and GDPR):
            </p>
            <ul className="space-y-3 text-[#6b6560]">
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Essential Cookies:</strong> May be used without
                  consent as they're necessary for service functionality.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Other Cookies:</strong> Require your explicit informed
                  consent before being placed.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Consent Management:</strong> You can change your
                  preferences at any time using our cookie settings.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#8E7A6B] font-medium mt-1">•</span>
                <span>
                  <strong>Withdrawal:</strong> You can withdraw consent to
                  non-essential cookies without penalty.
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
              How to Manage Cookies
            </h2>
            <p className="text-[#6b6560] leading-relaxed mb-6">
              You have multiple ways to control cookies:
            </p>

            <h3 className="font-medium text-[#1a1a1a] mb-3 text-lg">
              1. NextBazar Cookie Settings
            </h3>
            <p className="text-[#6b6560] leading-relaxed mb-6">
              Most browsers display a cookie consent banner when you first visit
              NextBazar. You can:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-6">
              <li>• Accept all cookies</li>
              <li>• Reject non-essential cookies</li>
              <li>• Customize your cookie preferences</li>
              <li>• Access settings later from your account preferences</li>
            </ul>

            <h3 className="font-medium text-[#1a1a1a] mb-3 text-lg">
              2. Browser Controls
            </h3>
            <p className="text-[#6b6560] leading-relaxed mb-4">
              Most browsers allow you to:
            </p>
            <ul className="space-y-2 text-[#6b6560] mb-6">
              <li>• View stored cookies and delete them</li>
              <li>• Block new cookies from being set</li>
              <li>• Block third-party cookies</li>
              <li>• Delete cookies when closing the browser</li>
            </ul>
            <p className="text-sm text-[#6b6560] mb-6">
              Please note: Disabling essential cookies may prevent some platform
              features from working properly.
            </p>

            <h3 className="font-medium text-[#1a1a1a] mb-3 text-lg">
              3. Do Not Track (DNT)
            </h3>
            <p className="text-[#6b6560] leading-relaxed">
              If your browser sends a Do Not Track signal, NextBazar will
              respect your preference where technically feasible and honor
              opt-out requests for marketing cookies.
            </p>
          </div>

          {/* Third-Party Links */}
          <div className="mb-12">
            <h2
              className="text-2xl font-light text-[#1a1a1a] mb-4 pb-3 border-b border-[#e8e6e3]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Third-Party Websites & Services
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
              Updates to This Policy
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
              Questions About Cookies?
            </h2>
            <p className="text-white/60 leading-relaxed mb-4">
              If you have questions about how NextBazar uses cookies or want to
              manage your preferences, please contact us:
            </p>
            <div className="bg-white/10 p-6 rounded-none border border-white/20">
              <p className="text-white mb-1">NextBazar Privacy Team</p>
              <p className="text-white/60 text-sm mb-4">privacy@nextbazar.cy</p>
              <p className="text-white/60 text-sm">
                We'll respond to cookie-related inquiries within 48 hours.
              </p>
            </div>
          </div>

          {/* Related */}
          <div className="bg-[#faf9f7] p-8 border border-[#e8e6e3]">
            <h3 className="font-medium text-[#1a1a1a] mb-4">
              Related Policies
            </h3>
            <p className="text-[#6b6560] text-sm leading-relaxed">
              For information about how we handle your personal data, see our{" "}
              <Link
                href="/privacy"
                className="text-[#8E7A6B] hover:text-[#7A6657] underline"
              >
                Privacy Policy
              </Link>
              . For terms governing use of the platform, see our{" "}
              <Link
                href="/terms"
                className="text-[#8E7A6B] hover:text-[#7A6657] underline"
              >
                Terms of Service
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
              Need Help? Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
