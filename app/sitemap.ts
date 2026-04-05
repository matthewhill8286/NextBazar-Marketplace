import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";
const LOCALES = ["en", "el", "ru"] as const;

/**
 * Dynamic sitemap that includes:
 *   - Static pages (home, about, pricing, etc.) × 3 locales
 *   - All active listing slugs × default locale
 *   - All active shop slugs × default locale
 *
 * Cached by Next.js and regenerated on deploy or revalidation.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──────────────────────────────────────────────────────
  const staticRoutes = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/pro-sellers", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/shops", changeFrequency: "daily" as const, priority: 0.7 },
    { path: "/search", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/vehicles", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/properties", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/cookies", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/safety", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  for (const route of staticRoutes) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  // ── Dynamic pages (listings + shops) ──────────────────────────────────
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Active listings — fetch up to 5000 for the sitemap
    const { data: listings } = await supabase
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("view_count", { ascending: false })
      .limit(5000);

    if (listings) {
      for (const listing of listings) {
        entries.push({
          url: `${BASE_URL}/en/listing/${listing.slug}`,
          lastModified: listing.updated_at
            ? new Date(listing.updated_at)
            : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // Active shops
    const { data: shops } = await supabase
      .from("dealer_shops")
      .select("slug, updated_at")
      .eq("plan_status", "active")
      .limit(1000);

    if (shops) {
      for (const shop of shops) {
        entries.push({
          url: `${BASE_URL}/en/shop/${shop.slug}`,
          lastModified: shop.updated_at
            ? new Date(shop.updated_at)
            : new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    // If DB query fails, still return static entries
    console.error("Sitemap: failed to fetch dynamic entries", error);
  }

  return entries;
}
