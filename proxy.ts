import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// next-intl locale routing middleware
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale routing for API routes and static assets
  const isApi = pathname.startsWith("/api");
  const isStatic = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname);

  if (!isApi && !isStatic) {
    const intlResponse = intlMiddleware(request);
    if (
      intlResponse &&
      (intlResponse.status === 301 ||
        intlResponse.status === 302 ||
        intlResponse.status === 307 ||
        intlResponse.headers.has("x-middleware-rewrite"))
    ) {
      return intlResponse;
    }
  }

  // ── Supabase session refresh ──────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strip locale prefix to check the actual route
  const localePattern = /^\/(en|el)(\/|$)/;
  const strippedPath = pathname.replace(localePattern, "/");

  if (
    !user &&
    (strippedPath.startsWith("/post") ||
      strippedPath.startsWith("/messages") ||
      strippedPath.startsWith("/dashboard"))
  ) {
    const url = request.nextUrl.clone();
    const locale = pathname.match(localePattern)?.[1] ?? "en";
    url.pathname = `/${locale}/auth/login`;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
