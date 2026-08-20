import { Outlet } from "react-router";
import DashboardShell from "@/app/[locale]/dashboard/dashboard-shell";
import DashboardSidebar from "@/app/[locale]/dashboard/sidebar";
import { requireUser } from "../auth.server";
import { loadDashboardData } from "@/lib/dashboard.server";
import type { Route } from "./+types/dashboard-layout";

export function meta() {
  return [
    { title: "Dashboard | NextBazar" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUser(request, params.locale!);
  return loadDashboardData(userId);
}

export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <DashboardSidebar
          profile={loaderData.sidebarProfile}
          isAdmin={loaderData.isAdmin}
        />
        <DashboardShell
          listings={loaderData.listings}
          isDealer={loaderData.isDealer}
          isProSeller={loaderData.isProSeller}
          planTier={loaderData.planTier}
          categories={loaderData.categories}
          subcategories={loaderData.subcategories}
          locations={loaderData.locations}
          shopData={loaderData.shopData}
        >
          <div className="min-w-0">
            <Outlet />
          </div>
        </DashboardShell>
      </div>
    </div>
  );
}
