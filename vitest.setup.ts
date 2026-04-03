import "@testing-library/jest-dom";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Global mocks for Next.js + next-intl navigation
// next-intl/navigation internally imports "next/navigation" without the .js
// extension which fails in Vitest's ESM-strict jsdom environment. Mock the
// whole chain so component tests can render without a real Next.js router.
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
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
