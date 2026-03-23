"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardSidebar from "./sidebar";

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
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
