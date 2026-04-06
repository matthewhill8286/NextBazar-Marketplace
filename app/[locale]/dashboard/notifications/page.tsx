"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import NotificationsClient from "./notifications-client";

export default function NotificationsPage() {
  const supabase = createClient();
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setLoading(false);
    }
    load();
  }, [userId, supabase]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-36 bg-[#e8e6e3] animate-pulse" />
          <div className="h-8 w-24 bg-[#e8e6e3] animate-pulse" />
        </div>
        <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-[#e8e6e3] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-[#e8e6e3] animate-pulse" />
                <div className="h-3 w-1/3 bg-[#e8e6e3] animate-pulse" />
              </div>
              <div className="w-12 h-3 bg-[#e8e6e3] animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <NotificationsClient initialNotifications={notifications} />;
}
