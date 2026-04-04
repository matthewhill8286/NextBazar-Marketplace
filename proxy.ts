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
  const isStatic =
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|webmanifest)$/.test(pathname);

  // Let Next.js handle the manifest route directly — no middleware processing
  if (pathname === "/manifest.webmanifest") {
    return NextResponse.next();
  }

  // Run next-intl middleware first to resolve locale headers & redirects
  let intlResponse: NextResponse | undefined;
  if (!isApi && !isStatic) {
    intlResponse = intlMiddleware(request);
    // If intl wants to redirect, return immediately
    if (
      intlResponse &&
      (intlResponse.status === 301 ||
        intlResponse.status === 302 ||
        intlResponse.status === 307)
    ) {
      return intlResponse;
    }
  }

  // ── Supabase session refresh ──────────────────────────────────────────────
  // Start from the intl response so locale headers (x-next-intl-locale etc.)
  // are preserved — this is what allows server-component <Link> to resolve
  // the current locale correctly.
  let supabaseResponse = intlResponse ?? NextResponse.next({ request });

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
          // Rebuild the response but preserve intl headers so locale
          // context survives into server components.
          const fresh = NextResponse.next({ request });
          if (intlResponse) {
            intlResponse.headers.forEach((v, k) => {
              fresh.headers.set(k, v);
            });
          }
          supabaseResponse = fresh;
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Strip locale prefix to check the actual route
  const localePattern = /^\/(en|el|ru)(\/|$)/;
  const strippedPath = pathname.replace(localePattern, "/");

  // Only call getUser() when we actually need auth (protected routes).
  // This avoids a blocking Supabase round-trip on every public page load.
  const needsAuth =
    strippedPath.startsWith("/post") ||
    strippedPath.startsWith("/messages") ||
    strippedPath.startsWith("/dashboard") ||
    strippedPath.startsWith("/shop-manager") ||
    strippedPath.startsWith("/shop-onboarding");

  if (needsAuth) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
  } else {
    // For public routes, still refresh the session cookie (non-blocking for
    // the page render since middleware runs before the page), but only if
    // there's already a session cookie present.
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    if (hasSession) {
      await supabase.auth.getUser();
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
