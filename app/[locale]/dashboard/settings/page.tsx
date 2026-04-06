"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import SettingsClient from "./settings-client";

export default function SettingsPage() {
  const supabase = createClient();
  const { userId } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: user } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("profiles")
        .select(
          "id, display_name, username, phone, bio, whatsapp_number, telegram_username, avatar_url",
        )
        .eq("id", userId)
        .single();

      setProfile({
        id: userId,
        email: user.user?.email || "",
        display_name: data?.display_name || null,
        username: data?.username || null,
        phone: data?.phone || null,
        bio: data?.bio || null,
        whatsapp_number: data?.whatsapp_number || null,
        telegram_username: data?.telegram_username || null,
        avatar_url: data?.avatar_url || null,
      });
      setLoading(false);
    }
    load();
  }, [userId, supabase]);

  if (loading) {
    return (
      <div>
        <div className="h-7 w-28 bg-[#e8e6e3] animate-pulse mb-6" />
        <div className="space-y-6">
          {/* Profile section */}
          <div className="bg-white border border-[#e8e6e3] p-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-[#e8e6e3] animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 bg-[#e8e6e3] animate-pulse" />
                <div className="h-4 w-56 bg-[#e8e6e3] animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-[#e8e6e3] animate-pulse" />
                <div className="h-10 w-full bg-[#e8e6e3] animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-[#e8e6e3] animate-pulse" />
                <div className="h-10 w-full bg-[#e8e6e3] animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-[#e8e6e3] animate-pulse" />
                <div className="h-24 w-full bg-[#e8e6e3] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Social links section */}
          <div className="bg-white border border-[#e8e6e3] p-5">
            <div className="h-5 w-28 bg-[#e8e6e3] animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-[#e8e6e3] animate-pulse" />
              <div className="h-10 w-full bg-[#e8e6e3] animate-pulse" />
              <div className="h-10 w-full bg-[#e8e6e3] animate-pulse" />
            </div>
          </div>

          {/* Save button */}
          <div className="h-11 w-full bg-[#e8e6e3] animate-pulse" />
        </div>
      </div>
    );
  }

  return <SettingsClient profile={profile} />;
}
