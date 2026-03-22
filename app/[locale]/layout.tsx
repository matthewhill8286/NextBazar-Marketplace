import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { SavedProvider } from "@/lib/saved-context";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import RealtimeToasts from "@/app/components/realtime-toasts";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

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
      { url: "/favicon.ico",    sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/nextbazar-icon.svg", color: "#3B82F6" },
    ],
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
  const messages: Messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SavedProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <RealtimeToasts />
            <Toaster
              position="top-right"
              visibleToasts={4}
              gap={8}
              toastOptions={{ unstyled: true, classNames: { toast: "" } }}
            />
          </SavedProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
