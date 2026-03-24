import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// Use service role to bypass RLS — same as the webhook handler
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    // Retrieve the Stripe checkout session to confirm it was actually paid
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Payment not completed",
          payment_status: session.payment_status,
        },
        { status: 402 },
      );
    }

    const listingId = session.metadata?.listing_id;
    const promotionType = session.metadata?.promotion_type;
    const durationDays = parseInt(session.metadata?.duration_days || "7", 10);

    if (!listingId || !promotionType) {
      return NextResponse.json(
        { error: "Session metadata missing listing_id or promotion_type" },
        { status: 422 },
      );
    }

    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + durationDays);

    const updateData: Record<string, any> = {};
    if (promotionType === "featured") {
      updateData.is_promoted = true;
      updateData.promoted_until = promotedUntil.toISOString();
    } else if (promotionType === "urgent") {
      updateData.is_urgent = true;
    }

    const { data, error } = await supabaseAdmin
      .from("listings")
      .update(updateData)
      .eq("id", listingId)
      .select("id, slug, title, is_promoted, is_urgent")
      .single();

    if (error) {
      console.error("Failed to activate promotion:", error);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      listing: data,
      promotionType,
      durationDays,
    });
  } catch (err: unknown) {
    console.error("Activate promotion error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to activate promotion" },
      { status: 500 },
    );
  }
}
