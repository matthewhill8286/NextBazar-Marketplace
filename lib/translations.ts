import { createTranslator, loadMessages } from "@/lib/i18n-translate";

export async function getMessages(
  locale: string,
): Promise<Record<string, unknown>> {
  return loadMessages(locale);
}

/**
 * Translator for loaders / non-React code. Route UI should prefer
 * `useTranslations()` so strings stay in the component tree.
 */
export async function getTranslator(locale: string, namespace: string) {
  const messages = await getMessages(locale);
  return createTranslator({ locale, messages, namespace });
}
