import { Outlet, redirect } from "react-router";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import type { Route } from "./+types/locale-layout";

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!isLocale(params.locale ?? "")) {
    const url = new URL(request.url);
    throw redirect(`/${DEFAULT_LOCALE}${url.pathname}${url.search}`);
  }
  return null;
}

export default function LocaleLayout() {
  return <Outlet />;
}
