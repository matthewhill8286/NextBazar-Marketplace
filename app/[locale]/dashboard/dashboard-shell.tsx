"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardSidebar from "./sidebar";

/* ── Skeleton pulse block ─────────────────────────────────────────────────── */
function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
    />
  );
}

function SidebarSkeleton() {
  return (
    <aside className="space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <Bone className="w-16 h-16 rounded-full" />
          <div className="space-y-2 w-full">
            <Bone className="h-4 w-28 mx-auto" />
            <Bone className="h-3 w-40 mx-auto" />
          </div>
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Bone className="h-14 rounded-xl" />
          <Bone className="h-14 rounded-xl" />
          <Bone className="h-14 rounded-xl" />
          <Bone className="h-14 rounded-xl" />
        </div>
      </div>
      {/* Nav items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Bone key={i} className="h-10 rounded-xl" />
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
        <Bone className="h-10 w-36 rounded-xl" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Bone className="w-9 h-9 rounded-lg" />
              <Bone className="h-3 w-12" />
            </div>
            <Bone className="h-7 w-16" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <Bone className="h-11 w-full max-w-md rounded-xl" />
      {/* Listing rows */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4"
          >
            <Bone className="w-16 h-12 rounded-lg shrink-0" />
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

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    active: 0,
    sold: 0,
    views: 0,
    favorites: 0,
  });
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

      const [{ data: prof }, { data: listings }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("listings")
          .select("status, view_count, favorite_count")
          .eq("user_id", user.id),
      ]);

      setProfile({
        display_name: prof?.display_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar_url: prof?.avatar_url || null,
        verified: prof?.verified || false,
        is_dealer: prof?.is_dealer || false,
      });

      // Simple admin check by email — swap in your own address
      const ADMIN_EMAILS = ["matthill8286@gmail.com"];
      setIsAdmin(ADMIN_EMAILS.includes(user.email || ""));

      const items = listings || [];
      setStats({
        active: items.filter((s) => s.status === "active").length,
        sold: items.filter((s) => s.status === "sold").length,
        views: items.reduce((sum, s) => sum + (s.view_count || 0), 0),
        favorites: items.reduce((sum, s) => sum + (s.favorite_count || 0), 0),
      });

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <SidebarSkeleton />
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {profile && (
          <DashboardSidebar profile={profile} stats={stats} isAdmin={isAdmin} />
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
