import { redirect } from "react-router";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import type { Route } from "./+types/auth-callback";

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("redirect") || "/";
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const locale = isLocale(params.locale ?? "") ? params.locale! : DEFAULT_LOCALE;
  const dest = next.startsWith("/") ? next : "/";
  const prefixed = dest.startsWith(`/${locale}`) || dest.startsWith("/api") ? dest : `/${locale}${dest === "/" ? "" : dest}`;
  throw redirect(prefixed);
}
