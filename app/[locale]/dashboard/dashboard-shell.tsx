"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardListing } from "@/lib/supabase/supabase.types";
import { DashboardProvider } from "./dashboard-context";
import DashboardSidebar from "./sidebar";

/* ── Skeleton pulse block ─────────────────────────────────────────────────── */
function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0eeeb] ${className}`} />;
}

function SidebarSkeleton() {
  return (
    <aside className="space-y-5">
      {/* Profile card */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <Bone className="w-16 h-16" />
          <div className="space-y-2 w-full">
            <Bone className="h-4 w-28 mx-auto" />
            <Bone className="h-3 w-40 mx-auto" />
          </div>
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Bone className="h-14" />
          <Bone className="h-14" />
          <Bone className="h-14" />
          <Bone className="h-14" />
        </div>
      </div>
      {/* Nav items */}
      <div className="bg-white border border-[#e8e6e3] p-3 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Bone key={`nav-item-${i}`} className="h-10" />
        ))}
      </div>
    </aside>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-36" />
        <Bone className="h-10 w-36" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`content-stats-${i}`}
            className="bg-white border border-[#e8e6e3] p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Bone className="w-9 h-9" />
              <Bone className="h-3 w-12" />
            </div>
            <Bone className="h-7 w-16" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <Bone className="h-11 w-full max-w-md" />
      {/* Listing rows */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`content-row-${i}`}
            className="flex items-center gap-4 bg-white border border-[#e8e6e3] p-4"
          >
            <Bone className="w-16 h-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
            <Bone className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

const LISTING_SELECT = `
  id, title, slug, price, currency, price_type, condition, status,
  primary_image_url, view_count, favorite_count, message_count,
  is_promoted, is_urgent, promoted_until, created_at, expires_at,
  category_id, location_id,
  categories(name, slug, icon),
  locations(name)
`;

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [isDealer, setIsDealer] = useState(false);
  const [isProSeller, setIsProSeller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }

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

      setProfile({
        display_name: prof?.display_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar_url: prof?.avatar_url || null,
        verified: prof?.verified || false,
        is_pro_seller: prof?.is_pro_seller || false,
      });

      // Simple admin check by email — swap in your own address
      const ADMIN_EMAILS = ["matthill8286@gmail.com"];
      setIsAdmin(ADMIN_EMAILS.includes(user.email || ""));

      const items = listingData || [];
      setListings(items);

      const dealer = prof?.is_pro_seller || false;
      setIsDealer(dealer);
      setIsProSeller(!!dealer && shop?.plan_status === "active");

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          <SidebarSkeleton />
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  return (
    <DashboardProvider value={{ listings, isDealer, isProSeller }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {profile && <DashboardSidebar profile={profile} isAdmin={isAdmin} />}
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </DashboardProvider>
  );
}
