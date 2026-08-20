import { createContext, createElement, useContext, type ReactNode } from "react";
import {
  createTranslator,
  type Messages,
  type Translator,
} from "@/lib/i18n-translate";
import { DEFAULT_LOCALE } from "@/lib/i18n";

type I18nValue = {
  locale: string;
  messages: Messages;
};

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  messages: {},
});

export function NextIntlClientProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  return createElement(I18nContext.Provider, {
    value: { locale, messages },
    children,
  });
}

export function useTranslations(namespace?: string): Translator {
  const { messages } = useContext(I18nContext);
  return createTranslator({ messages, namespace });
}

export function useLocale(): string {
  return useContext(I18nContext).locale;
}

export function useMessages(): Messages {
  return useContext(I18nContext).messages;
}

export { createTranslator };
