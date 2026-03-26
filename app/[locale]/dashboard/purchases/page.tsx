"use client";


import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PurchasesClient from "./purchases-client";

export default function PurchasesPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("offers")
        .select(`
          id,
          amount,
          counter_amount,
          currency,
          status,
          message,
          counter_message,
          created_at,
          responded_at,
          listings(id, title, slug, primary_image_url, price, currency, status, categories(name, slug, icon), locations(name)),
          seller:profiles!offers_seller_id_fkey(id, display_name, avatar_url, verified)
        `)
        .eq("buyer_id", user.id)
        .eq("status", "accepted")
        .order("responded_at", { ascending: false });

      setPurchases(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
        {/* Tabs skeleton */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 flex-1 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        {/* List rows skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="w-12 h-10 rounded-lg bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded-lg animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <PurchasesClient userId={userId || ""} purchases={purchases} />;
}
