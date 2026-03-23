import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/analytics/view  { listing_id }
// Increments today's view count for the listing in listing_analytics.
// Called from the listing detail page on mount (non-owner views only).
export async function POST(req: NextRequest) {
  try {
    const { listing_id } = await req.json();
    if (!listing_id) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Upsert today's row, incrementing views
    const { error } = await supabase.rpc("increment_listing_view", {
      p_listing_id: listing_id,
      p_date: today,
    });

    // If the RPC doesn't exist yet, fall back to a simple upsert
    if (error) {
      await supabase.from("listing_analytics").upsert(
        { listing_id, date: today, views: 1 },
        {
          onConflict: "listing_id,date",
          ignoreDuplicates: false,
        },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
