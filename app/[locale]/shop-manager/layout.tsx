import { redirect } from "next/navigation";

/**
 * Shop Manager has been merged into the Dashboard.
 * This layout redirects all /shop-manager/* routes to /dashboard/*.
 */
export default function ShopManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect("/dashboard");
}
