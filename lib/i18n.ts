export const LOCALES = ["en", "el", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}

export function withLocale(href: string, locale: string): string {
  if (!href.startsWith("/")) return href;
  if (LOCALES.some((l) => href === `/${l}` || href.startsWith(`/${l}/`))) {
    return href;
  }
  if (href.startsWith("/api") || href.startsWith("/sitemap") || href.startsWith("/robots")) {
    return href;
  }
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && isLocale(parts[1])) {
    const rest = `/${parts.slice(2).join("/")}`;
    return rest === "/" ? "/" : rest.replace(/\/$/, "") || "/";
  }
  return pathname;
}
