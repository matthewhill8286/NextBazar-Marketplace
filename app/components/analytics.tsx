"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { hasAnalyticsConsent } from "@/app/components/cookie-banner";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 loader — only fires if the user accepted cookies.
 *
 * Set NEXT_PUBLIC_GA_ID in your .env to enable. If not set, this renders
 * nothing. Consent is checked on mount and also listens for the
 * "cookie-consent-granted" event from the cookie banner.
 */
export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Check on mount
    if (hasAnalyticsConsent()) setAllowed(true);

    // Listen for consent granted after page load
    function onConsent() {
      setAllowed(true);
    }
    window.addEventListener("cookie-consent-granted", onConsent);
    return () =>
      window.removeEventListener("cookie-consent-granted", onConsent);
  }, []);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
