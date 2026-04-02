import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { origin } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: shop } = await supabase
      .from("dealer_shops")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!shop?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No dealer subscription found" },
        { status: 404 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: shop.stripe_customer_id,
      return_url: `${origin}/shop-manager`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Dealer portal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to open portal" },
      { status: 500 },
    );
  }
}
