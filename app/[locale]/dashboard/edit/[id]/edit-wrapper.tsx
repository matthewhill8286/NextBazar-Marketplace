"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import EditClient from "./edit-client";

export default function EditWrapper({ listingId }: { listingId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login?redirect=/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          id, title, description, price, price_type, condition, contact_phone,
          category_id, location_id, user_id, primary_image_url,
          is_promoted, video_url,
          images:listing_images(id, url, sort_order)
        `,
        )
        .eq("id", listingId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        // Sort images by sort_order so drag-reorder is preserved
        if (data.images) {
          data.images.sort(
            (a: { sort_order: number }, b: { sort_order: number }) =>
              a.sort_order - b.sort_order,
          );
        }
        setListing(data);
      }
      setLoading(false);
    }
    load();
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#8E7A6B] animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-[#6b6560] mb-4">Listing not found</p>
        <Link
          href="/dashboard/listings"
          className="text-[#8E7A6B] font-medium hover:underline"
        >
          Back to listings
        </Link>
      </div>
    );
  }

  return <EditClient listing={listing} />;
}
