"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import OffersClient from "./offers-client";

export default function OffersPage() {
  const searchParams = useSearchParams();
  const focusOfferId = searchParams.get("offer") ?? undefined;
  const initialTab =
    (searchParams.get("tab") as "received" | "sent") ?? undefined;
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-7 w-28 bg-[#e8e6e3] animate-pulse mb-6" />
        <div className="flex gap-1 bg-[#f0eeeb] p-1 mb-6">
          <div className="h-9 flex-1 bg-[#e8e6e3] animate-pulse" />
          <div className="h-9 flex-1 bg-[#e8e6e3] animate-pulse" />
        </div>
        <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="w-12 h-10 bg-[#e8e6e3] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-[#e8e6e3] animate-pulse" />
                <div className="h-3 w-1/2 bg-[#e8e6e3] animate-pulse" />
              </div>
              <div className="w-16 h-4 bg-[#e8e6e3] animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userId) return null;

  return (
    <OffersClient
      userId={userId}
      focusOfferId={focusOfferId}
      initialTab={initialTab}
    />
  );
}
