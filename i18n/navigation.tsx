import type { ComponentProps, ReactNode } from "react";
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
  redirect as rrRedirect,
  useLocation,
  useNavigate,
  useParams,
  useRevalidator,
} from "react-router";
import { DEFAULT_LOCALE, LOCALES, stripLocale, withLocale } from "@/lib/i18n";

type Href =
  | string
  | {
      pathname?: string;
      query?: Record<string, string | number | undefined>;
      hash?: string;
    };

function hrefToPath(href: Href): string {
  if (typeof href === "string") return href;
  const path = href.pathname || "/";
  const qs = href.query
    ? `?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(href.query)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString()}`
    : "";
  const hash = href.hash ? `#${href.hash.replace(/^#/, "")}` : "";
  return `${path}${qs}${hash}`;
}

function useCurrentLocale(): string {
  const params = useParams();
  return typeof params.locale === "string" ? params.locale : DEFAULT_LOCALE;
}

export function Link({
  href,
  locale,
  prefetch: _prefetch,
  replace,
  scroll,
  children,
  ...rest
}: {
  href: Href;
  locale?: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  children?: ReactNode;
} & Omit<ComponentProps<"a">, "href">) {
  const current = useCurrentLocale();
  const to = withLocale(hrefToPath(href), locale || current);
  return (
    <RouterLink
      to={to}
      replace={replace}
      preventScrollReset={scroll === false}
      {...(rest as Omit<RouterLinkProps, "to">)}
    >
      {children}
    </RouterLink>
  );
}

export function usePathname(): string {
  const { pathname } = useLocation();
  return stripLocale(pathname);
}

export function useRouter() {
  const navigate = useNavigate();
  const locale = useCurrentLocale();
  const revalidator = useRevalidator();

  return {
    push(href: Href, opts?: { scroll?: boolean; locale?: string }) {
      navigate(withLocale(hrefToPath(href), opts?.locale || locale));
    },
    replace(href: Href, opts?: { scroll?: boolean; locale?: string }) {
      navigate(withLocale(hrefToPath(href), opts?.locale || locale), {
        replace: true,
      });
    },
    back() {
      navigate(-1);
    },
    refresh() {
      revalidator.revalidate();
    },
    prefetch() {},
  };
}

export function redirect(href: string, locale?: string): never {
  const loc =
    locale ||
    LOCALES.find((l) => href.startsWith(`/${l}/`) || href === `/${l}`) ||
    DEFAULT_LOCALE;
  throw rrRedirect(withLocale(href, loc));
}
