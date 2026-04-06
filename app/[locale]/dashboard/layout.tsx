import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserId } from "@/lib/auth/require-auth";
import DashboardDataProvider from "./dashboard-data-provider";
import SidebarServer from "./sidebar-server";
import SidebarSkeleton from "./sidebar-skeleton";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s — Dashboard | NextBazar",
  },
  description:
    "Manage your NextBazar listings, messages, and account settings.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth check — reads x-user-id header set by middleware ───────────
  const userId = await getUserId();

  if (!userId) {
    redirect("/auth/login?redirect=/dashboard");
  }

  // ── Grid shell renders INSTANTLY — data streams in via Suspense ─────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar: skeleton shows immediately, real sidebar streams in */}
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarServer userId={userId} userEmail="" />
        </Suspense>

        {/* Content: loading.tsx shows while data provider resolves */}
        <Suspense>
          <DashboardDataProvider userId={userId}>
            <div className="min-w-0">{children}</div>
          </DashboardDataProvider>
        </Suspense>
      </div>
    </div>
  );
}
