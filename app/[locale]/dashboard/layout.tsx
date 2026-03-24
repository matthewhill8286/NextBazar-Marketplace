import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard — NextBazar",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard: redirect un-onboarded users to the onboarding wizard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      redirect("/onboarding");
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
