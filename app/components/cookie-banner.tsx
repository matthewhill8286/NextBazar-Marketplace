"use client";

import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const COOKIE_CONSENT_KEY = "nb_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

/**
 * GDPR-compliant cookie consent banner.
 * Shows on first visit; preference stored in a cookie (not localStorage).
 * Only gates non-essential cookies (analytics). Essential cookies (auth,
 * session) are always allowed.
 */
export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already made a choice
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE_CONSENT_KEY}=`));

    if (stored) {
      setConsent(stored.split("=")[1] as ConsentState);
    } else {
      // Small delay so it doesn't flash on first paint
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function saveConsent(choice: "accepted" | "declined") {
    // Store for 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${COOKIE_CONSENT_KEY}=${choice}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    setConsent(choice);
    setVisible(false);

    // If accepted, fire any deferred analytics
    if (choice === "accepted") {
      window.dispatchEvent(new CustomEvent("cookie-consent-granted"));
    }
  }

  if (!visible || consent) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-lg mx-auto sm:mx-0 sm:ml-auto pointer-events-auto bg-white border border-[#e8e6e3] shadow-lg p-5">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-[#8E7A6B] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1a1a1a] leading-relaxed mb-1">
              We use cookies to improve your experience and analyse site
              traffic.
            </p>
            <p className="text-xs text-[#6b6560] mb-4">
              Essential cookies are always active.{" "}
              <Link
                href="/cookies"
                className="underline hover:text-[#8E7A6B] transition-colors"
              >
                Learn more
              </Link>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => saveConsent("accepted")}
                className="px-4 py-2 bg-[#8E7A6B] text-white text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#7A6657] transition-colors"
              >
                Accept all
              </button>
              <button
                onClick={() => saveConsent("declined")}
                className="px-4 py-2 border border-[#e8e6e3] text-[#1a1a1a] text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#f0eeeb] transition-colors"
              >
                Essential only
              </button>
            </div>
          </div>
          <button
            onClick={() => saveConsent("declined")}
            className="text-[#b5ada6] hover:text-[#6b6560] transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to check if analytics cookies are allowed.
 * Call this before initialising any tracking scripts.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const stored = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_CONSENT_KEY}=`));
  return stored?.split("=")[1] === "accepted";
}
