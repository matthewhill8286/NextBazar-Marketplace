"use client";


import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SettingsClient from "./settings-client";

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select(
          "id, display_name, username, phone, bio, whatsapp_number, telegram_username",
        )
        .eq("id", user.id)
        .single();

      setProfile({
        id: user.id,
        email: user.email || "",
        display_name: data?.display_name || null,
        username: data?.username || null,
        phone: data?.phone || null,
        bio: data?.bio || null,
        whatsapp_number: data?.whatsapp_number || null,
        telegram_username: data?.telegram_username || null,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-7 w-28 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-6">
          {/* Profile section */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 w-56 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-24 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Social links section */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="h-5 w-28 bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Save button */}
          <div className="h-11 w-full bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return <SettingsClient profile={profile} />;
}
