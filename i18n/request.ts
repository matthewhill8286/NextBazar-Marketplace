/**
 * next-intl request configuration.
 *
 * This file is required by the `createNextIntlPlugin` in next.config.js.
 * It is NO LONGER in the critical rendering path for server components —
 * those now use `getTranslator()` from `@/lib/translations` which loads
 * messages via `"use cache"` and never touches `requestLocale`.
 *
 * This config is only used by:
 *  - The next-intl plugin (build-time setup)
 *  - `NextIntlClientProvider` in the layout (provides messages to client
 *    components using `useTranslations`)
 */

import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
