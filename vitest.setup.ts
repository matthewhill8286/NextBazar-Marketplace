import "@testing-library/jest-dom";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Global mock for @/i18n/navigation — this wraps next-intl/navigation which
// internally imports "next/navigation". The resolve.alias in vitest.config.mts
// handles the bare-specifier resolution; this mock provides a simple <a>-based
// Link so component tests don't need a real Next.js router or IntlProvider.
// ---------------------------------------------------------------------------

// Default next-intl mock — returns translation keys as-is.
// Individual test files can override with vi.mock("next-intl", ...) for
// richer translation maps; per-test mocks take precedence over this one.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    if (params) {
      let result = key;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{${k}}`, String(v));
      }
      return result;
    }
    return key;
  },
  useLocale: () => "en",
  useMessages: () => ({}),
  useNow: () => new Date(),
  useTimeZone: () => "UTC",
  useFormatter: () => ({
    number: (n: number) => String(n),
    dateTime: (d: Date) => d.toISOString(),
    relativeTime: (d: Date) => "",
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: ({
      href,
      children,
      className,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
      [key: string]: any;
    }) => React.createElement("a", { href, className, ...rest }, children),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => "/",
    redirect: vi.fn(),
  };
});
