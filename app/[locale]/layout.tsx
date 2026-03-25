import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import CompareBar from "@/app/components/compare-bar";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import RealtimeToasts from "@/app/components/realtime-toasts";
import { routing } from "@/i18n/routing";
import { CompareProvider } from "@/lib/compare-context";
import { SavedProvider } from "@/lib/saved-context";

type Messages = Record<string, unknown>;

export const metadata: Metadata = {
  title: "NextBazar — Buy & Sell Anything in Cyprus",
  description:
    "The smarter marketplace. AI-powered search, instant messaging, and trusted sellers. Buy and sell vehicles, property, electronics, and more.",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [{ rel: "mask-icon", url: "/nextbazar-icon.svg", color: "#3B82F6" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NextBazar",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "el")) {
    notFound();
  }

  // Load messages directly — no plugin required
  const messages: Messages = (await import(`../../messages/${locale}.json`))
    .default;

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SavedProvider>
            <CompareProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <CompareBar />
              <RealtimeToasts />
              <Toaster
                position="top-right"
                visibleToasts={4}
                gap={8}
                toastOptions={{
                  unstyled: true,
                  classNames: {
                    toast: "flex items-center gap-3 w-[360px] rounded-xl border px-4 py-3 shadow-lg text-sm font-medium",
                    success: "bg-green-50 border-green-200 text-green-800",
                    error: "bg-red-50 border-red-200 text-red-800",
                    info: "bg-indigo-50 border-indigo-200 text-indigo-800",
                    warning: "bg-amber-50 border-amber-200 text-amber-800",
                    default: "bg-white border-gray-200 text-gray-900",
                  },
                }}
              />
            </CompareProvider>
          </SavedProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
