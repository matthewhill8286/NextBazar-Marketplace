import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import DashboardShell from "./dashboard-shell";
import DashboardSidebar from "./sidebar";

export const metadata: Metadata = {
  title: "Dashboard — NextBazar",
};

const LISTING_SELECT = `
  id, title, slug, price, currency, price_type, condition, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, is_urgent, promoted_until, created_at, expires_at,
  category_id, location_id,
  categories(name, slug, icon),
  locations(name)
`;

const ADMIN_EMAILS = ["matthill8286@gmail.com"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // ── Auth check (server-side, instant redirect) ──────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  // ── Parallel data fetching (all on the server — no waterfalls) ──────────
  const [{ data: prof }, { data: listingData }, { data: shop }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("listings")
        .select(LISTING_SELECT)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("dealer_shops")
        .select("plan_status")
        .eq("user_id", user.id)
        .single(),
    ]);

  const profile = {
    display_name: prof?.display_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar_url: prof?.avatar_url || null,
    verified: prof?.verified || false,
    is_pro_seller: prof?.is_pro_seller || false,
  };

  const listings: DashboardListing[] =
    (listingData as DashboardListing[]) || [];
  const isDealer = prof?.is_pro_seller || false;
  const isProSeller = !!isDealer && shop?.plan_status === "active";
  const isAdmin = ADMIN_EMAILS.includes(user.email || "");

  // ── Server-rendered shell: sidebar is instant, children stream in ───────
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <DashboardSidebar profile={profile} isAdmin={isAdmin} />
        <DashboardShell
          listings={listings}
          isDealer={isDealer}
          isProSeller={isProSeller}
        >
          <div className="min-w-0">{children}</div>
        </DashboardShell>
      </div>
    </div>
  );
}
