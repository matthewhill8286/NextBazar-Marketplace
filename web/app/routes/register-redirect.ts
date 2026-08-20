import { redirect } from "react-router";
import { DEFAULT_LOCALE, isLocale, withLocale } from "@/lib/i18n";

export function loader({ params }: { params: { locale?: string } }) {
  const locale = isLocale(params.locale ?? "") ? params.locale! : DEFAULT_LOCALE;
  throw redirect(withLocale("/auth/signup", locale));
}
