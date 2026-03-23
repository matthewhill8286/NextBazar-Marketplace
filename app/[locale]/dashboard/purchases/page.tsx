"use client";

import { Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <PurchasesClient userId={userId || ""} purchases={purchases} />;
}
