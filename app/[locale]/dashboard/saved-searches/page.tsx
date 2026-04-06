"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import SavedSearchesClient from "./saved-searches-client";

export default function SavedSearchesPage() {
  const supabase = createClient();
  const { userId } = useAuth();
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setSearches(data || []);
      setLoading(false);
    }
    load();
  }, [userId, supabase]);

  if (loading) {
    return (
      <div>
        <div className="h-7 w-40 bg-[#e8e6e3] animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#e8e6e3] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-[#e8e6e3] animate-pulse" />
                <div className="h-3 w-32 bg-[#e8e6e3] animate-pulse" />
              </div>
              <div className="w-8 h-8 bg-[#e8e6e3] animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <SavedSearchesClient initialSearches={searches} />;
}
