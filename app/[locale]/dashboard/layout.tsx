import type { Metadata } from "next";
import DashboardShell from "./dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard — NextBazar",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
