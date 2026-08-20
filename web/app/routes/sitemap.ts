import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";
const LOCALES = ["en", "el", "ru"] as const;

export async function loader() {
  const urls: string[] = [];
  const staticRoutes = [
    "",
    "/about",
    "/pricing",
    "/shops",
    "/search",
    "/vehicles",
    "/properties",
    "/contact",
    "/terms",
    "/privacy",
    "/cookies",
    "/safety",
    "/faq",
    "/how-it-works",
    "/blog",
  ];
  for (const path of staticRoutes) {
    for (const locale of LOCALES) {
      urls.push(`${BASE_URL}/${locale}${path}`);
    }
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: listings } = await supabase
      .from("listings")
      .select("slug")
      .eq("status", "active")
      .order("view_count", { ascending: false })
      .limit(5000);
    for (const listing of listings ?? []) {
      urls.push(`${BASE_URL}/en/listing/${listing.slug}`);
    }
    const { data: shops } = await supabase
      .from("dealer_shops")
      .select("slug")
      .eq("plan_status", "active")
      .limit(1000);
    for (const shop of shops ?? []) {
      urls.push(`${BASE_URL}/en/shop/${shop.slug}`);
    }
  } catch (error) {
    console.error("sitemap generation failed", error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
