import { NextResponse } from "next/server";
import { getClientPricing } from "@/lib/stripe";

export async function GET() {
  try {
    const pricing = await getClientPricing();
    return NextResponse.json(pricing, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: unknown) {
    console.error("Pricing fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 },
    );
  }
}
