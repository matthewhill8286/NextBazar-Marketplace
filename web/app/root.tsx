import { NextIntlClientProvider } from "next-intl";
import * as Sentry from "@sentry/react-router";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  redirect,
  type MiddlewareFunction,
} from "react-router";
import { Toaster } from "sonner";
import Analytics from "@/app/components/analytics";
import CompareBar from "@/app/components/compare-bar";
import CookieBanner from "@/app/components/cookie-banner";
import Footer from "@/app/components/footer";
import JsonLd from "@/app/components/json-ld";
import Navbar from "@/app/components/navbar";
import RealtimeToasts from "@/app/components/realtime-toasts";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { FEATURE_FLAGS, SOFT_LAUNCH_CATEGORY_SLUGS } from "@/lib/feature-flags";
import { DEFAULT_LOCALE, isLocale, LOCALES } from "@/lib/i18n";
import { loadMessages } from "@/lib/i18n-translate";
import { SavedProvider } from "@/lib/saved-context";
import { organizationJsonLd } from "@/lib/seo";
import {
  getCategoriesCached,
  getSearchTrendingCached,
} from "@/lib/supabase/queries";
import type { ThemeMode } from "@/lib/theme-context";
import { ThemeProvider } from "@/lib/theme-context";
import {
  outgoingHeaders,
  runWithRequestContext,
} from "@/lib/request-context";
import { loadSessionUserId } from "./compat/resource";
import type { Route } from "./+types/root";
import "@/app/globals.css";

const NO_FLASH_THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);var v=m?decodeURIComponent(m[1]):'system';var d=v==='dark'||(v==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.dataset.theme=v;}catch(e){}})();`;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap",
  },
  { rel: "icon", href: "/nextbazar-icon.svg", type: "image/svg+xml" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

export function meta() {
  return [
    { title: "NextBazar — Buy & Sell Anything in Cyprus" },
    {
      name: "description",
      content:
        "The smarter marketplace. AI-powered search, instant messaging, and trusted sellers.",
    },
    { property: "og:site_name", content: "NextBazar" },
    { property: "og:image", content: `${BASE_URL}/og-image.png` },
  ];
}

export const middleware: MiddlewareFunction[] = [
  async ({ request }, next) => {
    return runWithRequestContext(request, async () => {
      const response = await next();
      const extra = outgoingHeaders();
      if (response instanceof Response) {
        for (const cookie of extra.getSetCookie()) {
          response.headers.append("Set-Cookie", cookie);
        }
      }
      return response;
    });
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const first = url.pathname.split("/").filter(Boolean)[0];
  const isDocument =
    !url.pathname.startsWith("/api") &&
    url.pathname !== "/sitemap.xml" &&
    url.pathname !== "/robots.txt";

  if (!first && isDocument) {
    throw redirect(`/${DEFAULT_LOCALE}`);
  }

  if (!isDocument) {
    return data({
      locale: DEFAULT_LOCALE,
      locales: LOCALES,
      userId: null,
      themeMode: "system" as ThemeMode,
      messages: {},
      navCategories: [],
      navTrending: [],
    });
  }

  const locale = isLocale(first) ? first : DEFAULT_LOCALE;
  const userId = await loadSessionUserId();
  const themeCookie = request.headers
    .get("Cookie")
    ?.match(/(?:^|;\s*)theme=([^;]+)/)?.[1] as ThemeMode | undefined;
  const themeMode: ThemeMode =
    themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
      ? themeCookie
      : "system";

    const [messages, allCategories, navTrending] = await Promise.all([
      loadMessages(locale),
      getCategoriesCached(),
      getSearchTrendingCached(),
    ]);

    const navCategories = FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES
      ? allCategories.filter((c) => SOFT_LAUNCH_CATEGORY_SLUGS.has(c.slug))
      : allCategories;

    return data({
      locale,
      locales: LOCALES,
      userId,
      themeMode,
      messages,
      navCategories: navCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })),
      navTrending,
    });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: no-flash theme
          dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }}
        />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#8E7A6B] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const {
    locale,
    userId,
    themeMode,
    messages,
    navCategories,
    navTrending,
  } = loaderData;

  const hasLocaleChrome = isLocale(locale);

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider initialMode={themeMode}>
          <AuthProvider initialUserId={userId}>
            <SavedProvider>
              <CompareProvider>
                {hasLocaleChrome ? (
                  <>
                    <Navbar categories={navCategories} trending={navTrending} />
                    <main id="main-content" className="flex-1">
                      <Outlet />
                    </main>
                    <Footer />
                    <CompareBar />
                    <RealtimeToasts />
                    <CookieBanner />
                    <Analytics />
                    <Toaster
                      position="top-right"
                      visibleToasts={4}
                      gap={8}
                      toastOptions={{
                        unstyled: true,
                        classNames: {
                          toast:
                            "flex items-center gap-3 w-[360px] border px-4 py-3 shadow-sm text-sm font-medium",
                          success:
                            "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
                          error:
                            "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
                          info: "bg-[#faf9f7] dark:bg-[#252220] border-[#e8e6e3] dark:border-[#3a3735] text-[#1a1a1a] dark:text-[#e8e6e3]",
                          warning:
                            "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
                          default:
                            "bg-white dark:bg-[#252220] border-[#e8e6e3] dark:border-[#3a3735] text-[#1a1a1a] dark:text-[#e8e6e3]",
                        },
                      }}
                    />
                  </>
                ) : (
                  <Outlet />
                )}
              </CompareProvider>
            </SavedProvider>
          </AuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    Sentry.captureException(error);
    if (import.meta.env.DEV) {
      details = error.message;
      stack = error.stack;
    }
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
