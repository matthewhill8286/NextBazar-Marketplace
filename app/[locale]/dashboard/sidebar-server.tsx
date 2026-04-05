import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "./sidebar";

const ADMIN_EMAILS = ["matthill8286@gmail.com"];

/**
 * Async server component that fetches profile data and renders the sidebar.
 * Wrapped in <Suspense> by the layout so it streams in without blocking.
 */
export default async function SidebarServer({
  userId,
}: {
  userId: string;
  userEmail: string;
}) {
  const supabase = await createClient();

  const [{ data: prof }, { data: shop }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("dealer_shops")
      .select("plan_status, plan_tier")
      .eq("user_id", userId)
      .single(),
  ]);

  const profile = {
    display_name: prof?.display_name || "User",
    email: prof?.email || "",
    avatar_url: prof?.avatar_url || null,
    verified: prof?.verified || false,
    is_pro_seller: prof?.is_pro_seller || false,
    plan_tier: shop?.plan_tier || null,
  };

  const isAdmin = ADMIN_EMAILS.includes(prof?.email || "");

  return <DashboardSidebar profile={profile} isAdmin={isAdmin} />;
}
