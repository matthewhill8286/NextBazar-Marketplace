import { redirect } from "react-router";
import { withLocale } from "@/lib/i18n";
import { getUserId } from "@/lib/auth/require-auth";

export async function requireUser(request: Request, locale: string) {
  const userId = await getUserId();
  if (!userId) {
    const url = new URL(request.url);
    const next = `${url.pathname}${url.search}`;
    throw redirect(withLocale(`/auth/login?redirect=${encodeURIComponent(next)}`, locale));
  }
  return userId;
}
