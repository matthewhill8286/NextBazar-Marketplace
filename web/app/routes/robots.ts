const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextbazar.com";

export function loader() {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /en/dashboard/
Disallow: /el/dashboard/
Disallow: /ru/dashboard/
Disallow: /en/admin/
Disallow: /el/admin/
Disallow: /ru/admin/
Disallow: /en/auth/
Disallow: /el/auth/
Disallow: /ru/auth/
Disallow: /en/messages/
Disallow: /el/messages/
Disallow: /ru/messages/
Disallow: /en/promote/
Disallow: /el/promote/
Disallow: /ru/promote/

Sitemap: ${BASE_URL}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
