"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import ListingsClient from "./listings-client";

export default function MyListingsPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("listings")
        .select(
          `
          id, title, slug, price, currency, price_type, condition, status,
          primary_image_url, view_count, favorite_count,
          is_promoted, is_urgent, created_at,
          category_id, location_id,
          categories(name, slug, icon),
          locations(name)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setListings(data || []);
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

  return <ListingsClient initialListings={listings} />;
}
