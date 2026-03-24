import createIntlMiddleware from "next-intl/middleware";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

/**
 * Lightweight Supabase client for middleware — anon key only, no cookies needed.
 * We just need to read public dealer_shops rows.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** The primary domain the app runs on (e.g. nextbazar.com or localhost:3000). */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // ── Step 1: Extract subdomain ──────────────────────────────────────────────
  // Strip port for comparison  (localhost:3000 → localhost)
  const rootDomainBase = ROOT_DOMAIN.replace(/:\d+$/, "");
  const hostnameBase = hostname.replace(/:\d+$/, "");

  // Determine if we're on a subdomain
  let shopSlug: string | null = null;

  if (hostnameBase !== rootDomainBase && hostnameBase !== "localhost") {
    // Could be: slug.nextbazar.com  OR  custom-domain.com
    if (hostnameBase.endsWith(`.${rootDomainBase}`)) {
      // Subdomain: extract the slug part
      const sub = hostnameBase.replace(`.${rootDomainBase}`, "");
      // Skip system subdomains
      if (!["www", "api", "admin", "app"].includes(sub)) {
        shopSlug = sub;
      }
    } else {
      // Custom domain: look up by custom_domain field
      // We'll resolve this to a slug below
      shopSlug = `custom:${hostnameBase}`;
    }
  }

  // ── Step 2: If this is a dealer subdomain/custom domain, rewrite ───────────
  if (shopSlug) {
    // Skip static files and API routes
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/favicon") ||
      pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff2?|css|js|map)$/)
    ) {
      return NextResponse.next();
    }

    let resolvedSlug = shopSlug;

    // If it's a custom domain, we need to look up the slug
    if (shopSlug.startsWith("custom:")) {
      const customDomain = shopSlug.replace("custom:", "");
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data } = await supabase
          .from("dealer_shops")
          .select("slug")
          .eq("custom_domain", customDomain)
          .eq("plan_status", "active")
          .single();

        if (!data) {
          // Unknown custom domain — redirect to main site
          return NextResponse.redirect(new URL("/", `https://${ROOT_DOMAIN}`));
        }
        resolvedSlug = data.slug;
      } catch {
        return NextResponse.redirect(new URL("/", `https://${ROOT_DOMAIN}`));
      }
    }

    // Rewrite to the shop route group with the slug in a header
    // /en/s/[slug]/... is the internal route for standalone shop pages
    const locale = pathname.match(/^\/(en|el)\//)?.[1] || "en";
    const pathWithoutLocale = pathname.replace(/^\/(en|el)/, "") || "/";

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/s/${resolvedSlug}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;

    const response = NextResponse.rewrite(url);
    // Pass shop context via headers so pages can detect standalone mode
    response.headers.set("x-shop-slug", resolvedSlug);
    response.headers.set("x-shop-domain", hostname);
    return response;
  }

  // ── Step 3: Normal request — pass through intl middleware ──────────────────
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
