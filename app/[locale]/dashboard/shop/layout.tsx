/**
 * The Shop CMS has moved to /shop-manager.
 * This layout is now a pass-through — the page.tsx handles the redirect.
 */
export default function ShopLegacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
