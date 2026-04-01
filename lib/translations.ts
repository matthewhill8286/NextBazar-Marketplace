/**
 * Cached server-side translation utility.
 *
 * Replaces `getTranslations` from `next-intl/server` which internally calls
 * `requestLocale` — a dynamic API that blocks static shells and breaks
 * `unstable_instant` routes.
 *
 * Instead, this module:
 *  1. Loads messages per-locale with `"use cache"` (revalidates hourly)
 *  2. Creates a translator via next-intl's `createTranslator` (supports
 *     `t()`, `t.rich()`, `t.raw()`, ICU plurals — the full API)
 *  3. Accepts locale as an explicit argument — no dynamic request APIs
 *
 * Server components receive `locale` from the page's `params` and call
 * `getTranslator(locale, namespace)`.  Client components still use
 * `useTranslations()` from next-intl (powered by `NextIntlClientProvider`
 * in the layout — no `requestLocale` involved).
 */

import { cacheLife, cacheTag } from "next/cache";
import { createTranslator } from "next-intl";

// ─── Cached message loader ──────────────────────────────────────────────────

export async function getMessages(
  locale: string,
): Promise<Record<string, unknown>> {
  "use cache";
  cacheLife("reference"); // 1 hour revalidate
  cacheTag("i18n");

  return (await import(`../messages/${locale}.json`)).default;
}

// ─── Translator factory ─────────────────────────────────────────────────────

/**
 * Returns a fully-featured translator (`t`, `t.rich`, `t.raw`, etc.)
 * for the given locale and namespace — identical API to what
 * `getTranslations` returns, but with zero dynamic dependencies.
 */
export async function getTranslator(locale: string, namespace: string) {
  const messages = await getMessages(locale);
  // Cast messages to the shape createTranslator expects. Our JSON files
  // are untyped at the module boundary, so we widen the type to allow
  // any string key to be resolved.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createTranslator({
    locale,
    messages: messages as any,
    namespace,
  });
}
