"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OffersClient from "./offers-client";

export default function OffersPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const [{ data: rec }, { data: snt }] = await Promise.all([
        supabase
          .from("offers")
          .select(`*, listings(id,title,slug,primary_image_url,price,currency), buyer:profiles!offers_buyer_id_fkey(id,display_name,avatar_url)`)
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("offers")
          .select(`*, listings(id,title,slug,primary_image_url,price,currency), seller:profiles!offers_seller_id_fkey(id,display_name,avatar_url)`)
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setReceived(rec || []);
      setSent(snt || []);
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

  return (
    <OffersClient
      userId={userId || ""}
      receivedOffers={received}
      sentOffers={sent}
    />
  );
}
