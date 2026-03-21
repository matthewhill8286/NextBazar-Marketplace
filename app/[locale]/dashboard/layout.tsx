import DashboardShell from "./dashboard-shell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — NextBazar",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
