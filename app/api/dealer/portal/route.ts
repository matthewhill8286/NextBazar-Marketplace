import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { origin } = await request.json();

    if (!origin) {
      return NextResponse.json(
        { error: "Missing origin" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: shop } = await supabase
      .from("dealer_shops")
      .select("stripe_customer_id, plan_status, plan_tier")
      .eq("user_id", user.id)
      .single();

    if (!shop) {
      return NextResponse.json(
        { error: "No dealer shop found. Please set up your shop first." },
        { status: 404 },
      );
    }

    if (!shop.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "No billing account found. This may happen if you're on the free tier — subscribe to a paid plan first.",
        },
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

    // Stripe throws specific errors for unconfigured billing portals
    const message =
      err instanceof Error ? err.message : "Failed to open billing portal";

    // Common Stripe error: billing portal not configured
    if (message.includes("No configuration was found")) {
      return NextResponse.json(
        {
          error:
            "The billing portal is not configured yet. Please contact support or manage your subscription from your Stripe dashboard.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
