import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { Toaster } from "sonner";
import CompareBar from "@/app/components/compare-bar";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import RealtimeToasts from "@/app/components/realtime-toasts";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/auth-context";
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
    other: [{ rel: "mask-icon", url: "/nextbazar-icon.svg", color: "#8E7A6B" }],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf9f7]">
        <Suspense>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
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
                        toast:
                          "flex items-center gap-3 w-[360px] border px-4 py-3 shadow-sm text-sm font-medium",
                        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
                        error: "bg-red-50 border-red-200 text-red-800",
                        info: "bg-[#faf9f7] border-[#e8e6e3] text-[#1a1a1a]",
                        warning: "bg-amber-50 border-amber-200 text-amber-800",
                        default: "bg-white border-[#e8e6e3] text-[#1a1a1a]",
                      },
                    }}
                  />
                </CompareProvider>
              </SavedProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
