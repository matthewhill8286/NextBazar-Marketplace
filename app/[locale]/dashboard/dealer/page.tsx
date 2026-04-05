import { redirect } from "next/navigation";

/**
 * Legacy dealer dashboard route — redirects to the dashboard.
 */
export default function DealerDashboardPage() {
  redirect("/dashboard");
}
