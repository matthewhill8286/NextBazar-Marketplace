import { redirect } from "next/navigation";

/**
 * Legacy shop dashboard route — redirects to the dashboard.
 */
export default function ShopPageRedirect() {
  redirect("/dashboard");
}
