import { redirect } from "react-router";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

/** Send unprefixed marketplace URLs to the default locale. */
export function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[0] === "auth" && parts[1] === "register") {
    throw redirect(`/${DEFAULT_LOCALE}/auth/signup${url.search}`);
  }

  if (isLocale(parts[0])) {
    throw new Response("Not Found", { status: 404, statusText: "Not Found" });
  }

  throw redirect(`/${DEFAULT_LOCALE}${url.pathname}${url.search}`);
}
