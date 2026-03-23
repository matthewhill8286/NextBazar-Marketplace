"use client";

import { Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return <SettingsClient profile={profile} />;
}
