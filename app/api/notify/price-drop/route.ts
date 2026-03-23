import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// POST /api/notify/price-drop
// Body: { listing_id, old_price, new_price }
// Called from edit-client when seller lowers the price.
// Inserts a notification row for every user who has favourited this listing.
export async function POST(req: NextRequest) {
  try {
    // Verify the caller is the listing owner
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { listing_id, old_price, new_price } = await req.json();
    if (!listing_id || old_price == null || new_price == null) {
      return NextResponse.json(
        { ok: false, error: "Missing fields" },
        { status: 400 },
      );
    }

    if (new_price >= old_price) {
      return NextResponse.json({ ok: true, notified: 0 });
    }

    // Fetch listing details
    const { data: listing } = await supabaseAdmin
      .from("listings")
      .select("id, title, slug, user_id")
      .eq("id", listing_id)
      .single();

    if (!listing || listing.user_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Find users who have favourited this listing (excluding the owner)
    const { data: favs } = await supabaseAdmin
      .from("favorites")
      .select("user_id")
      .eq("listing_id", listing_id)
      .neq("user_id", user.id);

    if (!favs || favs.length === 0) {
      return NextResponse.json({ ok: true, notified: 0 });
    }

    const sym = "€";
    const drop = Math.round(((old_price - new_price) / old_price) * 100);

    const rows = favs.map((f) => ({
      user_id: f.user_id,
      type: "price_drop",
      title: `Price dropped on "${listing.title}"`,
      body: `The price dropped ${drop}% from ${sym}${Number(old_price).toLocaleString()} to ${sym}${Number(new_price).toLocaleString()}.`,
      listing_id: listing.id,
      link: `/listing/${listing.slug}`,
    }));

    await supabaseAdmin.from("notifications").insert(rows);

    return NextResponse.json({ ok: true, notified: rows.length });
  } catch (err) {
    console.error("price-drop notify error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
