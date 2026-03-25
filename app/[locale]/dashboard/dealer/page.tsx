import { redirect } from "next/navigation";

/**
 * Legacy dealer dashboard route — redirects to the dedicated shop page.
 */
export default function DealerDashboardPage() {
  redirect("/dashboard/shop");
}
