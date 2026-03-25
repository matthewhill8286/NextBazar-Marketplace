import { redirect } from "next/navigation";

/**
 * Legacy dealer dashboard route — redirects to the unified dashboard
 * with the "My Shop" tab active.
 */
export default function DealerDashboardPage() {
  redirect("/dashboard?view=my-shop");
}
