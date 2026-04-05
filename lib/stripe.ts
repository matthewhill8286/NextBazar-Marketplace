import Stripe from "stripe";
import type { SellerTier } from "@/lib/pricing-config";
import { SELLER_PLANS } from "@/lib/pricing-config";
import { getPricingMap } from "@/lib/supabase/queries";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// ─── Types ─────────────────────────────────────────────────────────────────

export type PromotionType = "featured" | "urgent";

export type PromotionPriceInfo = {
  priceId: string | null;
  name: string;
  description: string;
  amount: number; // cents
  duration: number; // days
};

export type SellerPlanInfo = {
  priceId: string;
  dbKey: string;
  name: string;
  description: string;
  amount: number; // cents
  interval: "month" | "year";
  tier: SellerTier;
  billingCycle: "monthly" | "yearly";
};

// Keep the old type for backward compat with /api/pricing consumers
export type DealerPlanInfo = SellerPlanInfo;

// ─── Promotion helpers ─────────────────────────────────────────────────────

/** Fetch promotion prices from the DB pricing table. */
export async function getPromotionPrices(): Promise<
  Record<PromotionType, PromotionPriceInfo>
> {
  const map = await getPricingMap();
  const featured = map.featured;
  const urgent = map.urgent;

  return {
    featured: {
      priceId: featured?.stripe_price_id ?? null,
      name: featured?.name ?? "Featured Listing",
      description:
        featured?.description ?? "Top placement + highlighted for 7 days",
      amount: featured?.amount ?? 999,
      duration: featured?.duration_days ?? 7,
    },
    urgent: {
      priceId: urgent?.stripe_price_id ?? null,
      name: urgent?.name ?? "Quick Boost",
      description:
        urgent?.description ??
        "Boosted visibility + priority in search for 3 days",
      amount: urgent?.amount ?? 499,
      duration: urgent?.duration_days ?? 3,
    },
  };
}

// ─── Seller plan helpers ───────────────────────────────────────────────────

/**
 * Resolve a specific seller plan from the DB pricing table.
 * @param tier     - "starter" | "pro" | "business"
 * @param billing  - "monthly" | "yearly"
 */
export async function getSellerPlan(
  tier: SellerTier = "pro",
  billing: "monthly" | "yearly" = "monthly",
): Promise<SellerPlanInfo> {
  const config = SELLER_PLANS.find((p) => p.key === tier);
  if (!config) throw new Error(`Unknown seller tier: ${tier}`);

  const dbKey =
    billing === "monthly" ? config.dbKeyMonthly : config.dbKeyYearly;
  const map = await getPricingMap();
  const row = map[dbKey];

  const stripeInterval: "month" | "year" =
    billing === "yearly" ? "year" : "month";
  const amount =
    row?.amount ??
    (billing === "monthly" ? config.monthlyAmount : config.yearlyAmount);

  return {
    priceId: row?.stripe_price_id ?? "",
    dbKey,
    name: row?.name ?? config.name,
    description: row?.description ?? config.tagline,
    amount,
    interval: stripeInterval,
    tier,
    billingCycle: billing,
  };
}

/** Backward-compat alias — returns the Pro monthly plan. */
export async function getDealerPlan(): Promise<DealerPlanInfo> {
  return getSellerPlan("pro", "monthly");
}

/**
 * Fetch ALL active seller plans from the DB for the pricing page.
 * Returns an array with monthly + yearly variants for Pro and Business.
 */
export async function getAllSellerPlans(): Promise<SellerPlanInfo[]> {
  const tiers: SellerTier[] = ["pro", "business"];
  const cycles: ("monthly" | "yearly")[] = ["monthly", "yearly"];
  const plans: SellerPlanInfo[] = [];

  for (const tier of tiers) {
    for (const cycle of cycles) {
      plans.push(await getSellerPlan(tier, cycle));
    }
  }
  return plans;
}

// ─── Formatting ────────────────────────────────────────────────────────────

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

export type ClientSellerPlan = {
  tier: SellerTier;
  name: string;
  price: string;
  amount: number;
  interval: string;
  billingCycle: "monthly" | "yearly";
};

export type ClientPricing = {
  featured: { price: string; amount: number; duration: number; name: string };
  urgent: { price: string; amount: number; duration: number; name: string };
  dealer: { price: string; amount: number; interval: string; name: string };
  sellerPlans: ClientSellerPlan[];
};

/** Fetch all pricing and return a serializable object for client components. */
export async function getClientPricing(): Promise<ClientPricing> {
  const promos = await getPromotionPrices();
  const dealer = await getDealerPlan();
  const allPlans = await getAllSellerPlans();

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
    sellerPlans: allPlans.map((p) => ({
      tier: p.tier,
      name: p.name,
      price: formatPrice(p.amount),
      amount: p.amount,
      interval: p.interval,
      billingCycle: p.billingCycle,
    })),
  };
}
