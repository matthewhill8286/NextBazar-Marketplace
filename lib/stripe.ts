import Stripe from "stripe";
import { getPricingMap, type PricingRow } from "@/lib/supabase/queries";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// ─── DB-driven pricing helpers ──────────────────────────────────────────────

export type PromotionType = "featured" | "urgent";

export type PromotionPriceInfo = {
  priceId: string;
  name: string;
  description: string;
  amount: number; // cents
  duration: number; // days
};

export type DealerPlanInfo = {
  priceId: string;
  name: string;
  description: string;
  amount: number; // cents
  interval: "month" | "year";
};

/** Fetch promotion prices from the DB pricing table. */
export async function getPromotionPrices(): Promise<
  Record<PromotionType, PromotionPriceInfo>
> {
  const map = await getPricingMap();
  const featured = map["featured"];
  const urgent = map["urgent"];

  return {
    featured: {
      priceId: featured?.stripe_price_id ?? "price_1TD6LxI6t3gE5tEXGDty8s9J",
      name: featured?.name ?? "Featured Listing",
      description:
        featured?.description ?? "Top placement + highlighted for 7 days",
      amount: featured?.amount ?? 999,
      duration: featured?.duration_days ?? 7,
    },
    urgent: {
      priceId: urgent?.stripe_price_id ?? "price_1TD6M3I6t3gE5tEXMP3hRen1",
      name: urgent?.name ?? "Urgent Badge",
      description:
        urgent?.description ?? "Urgent badge + priority in search for 3 days",
      amount: urgent?.amount ?? 500,
      duration: urgent?.duration_days ?? 3,
    },
  };
}

/** Fetch dealer plan pricing from the DB pricing table. */
export async function getDealerPlan(): Promise<DealerPlanInfo> {
  const map = await getPricingMap();
  const dealer = map["dealer_pro"];

  return {
    priceId:
      dealer?.stripe_price_id ?? process.env.STRIPE_DEALER_PRICE_ID ?? "",
    name: dealer?.name ?? "Dealer Pro",
    description:
      dealer?.description ??
      "Unlimited listings, branded shop page, analytics & inventory tools",
    amount: dealer?.amount ?? 3500,
    interval: (dealer?.interval as "month" | "year") ?? "month",
  };
}

/** Format cents to display string, e.g. 999 → "€9.99" */
export function formatPrice(amountCents: number, currency = "EUR"): string {
  const symbol = currency === "EUR" ? "€" : currency;
  const value = (amountCents / 100).toFixed(2);
  // Remove trailing .00 for whole numbers
  const display = value.endsWith(".00")
    ? value.slice(0, -3)
    : value.endsWith("0")
      ? value.slice(0, -1)
      : value;
  return `${symbol}${display}`;
}

// ─── Serializable pricing for client components ─────────────────────────────

export type ClientPricing = {
  featured: { price: string; amount: number; duration: number; name: string };
  urgent: { price: string; amount: number; duration: number; name: string };
  dealer: { price: string; amount: number; interval: string; name: string };
};

/** Fetch all pricing and return a serializable object for client components. */
export async function getClientPricing(): Promise<ClientPricing> {
  const promos = await getPromotionPrices();
  const dealer = await getDealerPlan();

  return {
    featured: {
      price: formatPrice(promos.featured.amount),
      amount: promos.featured.amount,
      duration: promos.featured.duration,
      name: promos.featured.name,
    },
    urgent: {
      price: formatPrice(promos.urgent.amount),
      amount: promos.urgent.amount,
      duration: promos.urgent.duration,
      name: promos.urgent.name,
    },
    dealer: {
      price: formatPrice(dealer.amount),
      amount: dealer.amount,
      interval: dealer.interval,
      name: dealer.name,
    },
  };
}
