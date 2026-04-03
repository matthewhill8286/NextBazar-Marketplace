import { redirect } from "next/navigation";

/**
 * Legacy dealer dashboard route — redirects to the standalone Shop Manager.
 */
export default function DealerDashboardPage() {
  redirect("/shop-manager");
}
