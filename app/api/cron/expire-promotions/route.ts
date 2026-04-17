import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { revalidateListings } from "@/app/actions/revalidate";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * GET /api/cron/expire-promotions
 *
 * Called by Vercel Cron every hour.
 * Finds listings where promoted_until / boosted_until has passed and
 * flips is_promoted / is_urgent back to false so they stop appearing
 * as featured in search results, feeds, and the dashboard.
 *
 * Protected by CRON_SECRET — only Vercel can invoke this.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !cronSecret) {
    console.error(
      "CRON_SECRET is not set in production — refusing cron request.",
    );
    return NextResponse.json(
      { error: "Cron endpoint not configured" },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  let expiredFeatured = 0;
  let expiredUrgent = 0;

  // 1. Expire featured promotions (is_promoted + promoted_until in the past)
  const { data: featured, error: featuredErr } = await supabaseAdmin
    .from("listings")
    .update({
      is_promoted: false,
      promoted_until: null,
    })
    .eq("is_promoted", true)
    .lt("promoted_until", now)
    .select("id");

  if (featuredErr) {
    console.error("Failed to expire featured promotions:", featuredErr);
  } else {
    expiredFeatured = featured?.length ?? 0;
  }

  // 2. Expire urgent boosts (is_urgent + boosted_until in the past)
  const { data: urgent, error: urgentErr } = await supabaseAdmin
    .from("listings")
    .update({
      is_urgent: false,
      boosted_until: null,
    })
    .eq("is_urgent", true)
    .lt("boosted_until", now)
    .select("id");

  if (urgentErr) {
    console.error("Failed to expire urgent boosts:", urgentErr);
  } else {
    expiredUrgent = urgent?.length ?? 0;
  }

  // 3. Bust listing caches so feeds/detail pages reflect the change
  if (expiredFeatured > 0 || expiredUrgent > 0) {
    await revalidateListings();
  }

  return NextResponse.json({
    expiredFeatured,
    expiredUrgent,
  });
}
