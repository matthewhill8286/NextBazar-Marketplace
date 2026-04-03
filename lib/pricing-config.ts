/**
 * Comprehensive pricing configuration for NextBazar.
 *
 * Three pricing categories:
 *   1. Seller Plans   — monthly/yearly subscriptions for shop owners
 *   2. Listing Boosts — one-time promotions for individual listings
 *   3. Buyer+         — platform membership for buyers (future)
 *
 * Amounts are in EUR **cents** (e.g. 2900 = €29.00).
 * DB `pricing` rows are the source of truth for Stripe checkout;
 * this config drives the marketing/comparison UI.
 *
 * ─── Cost model (Supabase as BFF) ──────────────────────────────────────────
 * Supabase Pro: ~$25/mo  (8 GB DB, 100 GB storage, 250 GB bandwidth)
 * Per-seller overhead:
 *   Starter  ≈ €0.10/mo  (10 listings × 2 imgs, minimal queries)
 *   Pro      ≈ €0.80/mo  (unlimited listings avg ~60, 10 imgs, analytics)
 *   Business ≈ €3.50/mo  (200+ listings, 20 imgs, CSV, AI desc, realtime)
 *
 * Boost infra cost ≈ €0 (just a DB flag flip + cron re-rank).
 * Buyer+ infra cost ≈ €0.05/mo (price-alert cron + extra saved-search rows).
 *
 * Target gross margins:
 *   Seller Pro      → ~97 %   (€29 revenue vs €0.80 cost)
 *   Seller Business → ~96 %   (€89 revenue vs €3.50 cost)
 *   Boosts          → ~99 %   (pure DB flags)
 *   Buyer+          → ~99 %   (lightweight features)
 *
 * Additional revenue: 3.5 % platform commission on completed transactions
 * above €500 (not modelled here — handled in checkout flow).
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Seller / Dealer Plans ──────────────────────────────────────────────────

export type SellerTier = "starter" | "pro" | "business";

export interface SellerPlan {
  key: SellerTier;
  name: string;
  tagline: string;
  monthlyAmount: number; // cents
  yearlyAmount: number; // cents (total per year)
  yearlyMonthly: number; // monthly equivalent when billed yearly
  /** DB pricing key for monthly billing */
  dbKeyMonthly: string;
  /** DB pricing key for yearly billing */
  dbKeyYearly: string;
  popular?: boolean;
  features: string[];
  limits: {
    activeListings: number | "unlimited";
    images: number;
    boostsPerMonth: number;
    teamMembers: number;
  };
}

export const SELLER_PLANS: SellerPlan[] = [
  {
    key: "starter",
    name: "Starter",
    tagline: "For individuals getting started",
    monthlyAmount: 0,
    yearlyAmount: 0,
    yearlyMonthly: 0,
    dbKeyMonthly: "dealer_starter",
    dbKeyYearly: "dealer_starter_yearly",
    features: [
      "Up to 10 active listings",
      "2 images per listing",
      "Basic shop page",
      "Messages & offers",
      "Community support",
    ],
    limits: {
      activeListings: 10,
      images: 2,
      boostsPerMonth: 0,
      teamMembers: 1,
    },
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "For serious sellers who want to grow",
    monthlyAmount: 2900, // €29
    yearlyAmount: 28800, // €288 (€24/mo — save 17%)
    yearlyMonthly: 2400,
    dbKeyMonthly: "dealer_pro",
    dbKeyYearly: "dealer_pro_yearly",
    popular: true,
    features: [
      "Unlimited active listings",
      "10 images per listing",
      "3 free Boosts per month",
      "Branded shop page",
      "Analytics dashboard",
      "Quick-reply templates",
      "Priority in search results",
      "Priority support",
    ],
    limits: {
      activeListings: "unlimited",
      images: 10,
      boostsPerMonth: 3,
      teamMembers: 1,
    },
  },
  {
    key: "business",
    name: "Business",
    tagline: "For dealerships & high-volume sellers",
    monthlyAmount: 8900, // €89
    yearlyAmount: 82800, // €828 (€69/mo — save 22%)
    yearlyMonthly: 6900,
    dbKeyMonthly: "dealer_business",
    dbKeyYearly: "dealer_business_yearly",
    features: [
      "Everything in Pro",
      "20 images per listing + video tours",
      "10 free Boosts per month",
      "CSV bulk import",
      "Stock management & alerts",
      "AI listing descriptions",
      "Team members (up to 5)",
      "Verified dealer badge",
      "Featured on homepage",
      "Dedicated account manager",
    ],
    limits: {
      activeListings: "unlimited",
      images: 20,
      boostsPerMonth: 10,
      teamMembers: 5,
    },
  },
];

// ─── Listing Boost Packages ─────────────────────────────────────────────────

export type BoostTier = "spotlight" | "featured" | "urgent" | "bundle";

export interface BoostPackage {
  key: BoostTier;
  name: string;
  tagline: string;
  amount: number; // cents
  durationDays: number;
  dbKey: string;
  popular?: boolean;
  perks: string[];
}

export const BOOST_PACKAGES: BoostPackage[] = [
  {
    key: "urgent",
    name: "Quick Boost",
    tagline: "Get noticed fast",
    amount: 499, // €4.99  (infra cost ≈ €0 → 99 % margin)
    durationDays: 3,
    dbKey: "urgent",
    perks: [
      "Urgent badge for 3 days",
      "Highlighted in search results",
      "Email alert to watchers",
    ],
  },
  {
    key: "featured",
    name: "Featured",
    tagline: "Maximum visibility",
    amount: 799, // €7.99  (infra cost ≈ €0 → 99 % margin)
    durationDays: 7,
    dbKey: "featured",
    popular: true,
    perks: [
      "Pinned to top of category for 7 days",
      "Featured badge on listing",
      "Shown in \"Featured\" sections",
      "2× more views on average",
    ],
  },
  {
    key: "spotlight",
    name: "Spotlight",
    tagline: "Premium placement",
    amount: 1499, // €14.99  (infra cost ≈ €0 → 99 % margin)
    durationDays: 14,
    dbKey: "spotlight",
    perks: [
      "Everything in Featured for 14 days",
      "Homepage carousel placement",
      "Social media promotion",
      "5× more views on average",
    ],
  },
  {
    key: "bundle",
    name: "Power Pack",
    tagline: "Best value for multiple listings",
    amount: 3499, // €34.99  (5× Featured would be €39.95 — saves 12 %)
    durationDays: 7,
    dbKey: "boost_bundle",
    perks: [
      "Featured + Urgent on 5 listings",
      "7 days of premium visibility each",
      "Save 12% vs. buying individually",
      "Ideal for dealers & shops",
    ],
  },
];

// ─── Buyer+ Platform Membership ─────────────────────────────────────────────

export type BuyerTier = "free" | "plus" | "premium";

export interface BuyerPlan {
  key: BuyerTier;
  name: string;
  tagline: string;
  monthlyAmount: number; // cents
  yearlyAmount: number; // cents
  yearlyMonthly: number;
  dbKeyMonthly: string;
  dbKeyYearly: string;
  popular?: boolean;
  features: string[];
}

export const BUYER_PLANS: BuyerPlan[] = [
  {
    key: "free",
    name: "Free",
    tagline: "Browse & buy, no cost",
    monthlyAmount: 0,
    yearlyAmount: 0,
    yearlyMonthly: 0,
    dbKeyMonthly: "buyer_free",
    dbKeyYearly: "buyer_free_yearly",
    features: [
      "Browse all listings",
      "Save up to 10 listings",
      "Send messages & offers",
      "Basic search filters",
      "Email notifications",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    tagline: "Smarter buying tools",
    monthlyAmount: 599, // €5.99  (infra cost ≈ €0.05 → 99 % margin)
    yearlyAmount: 4999, // €49.99 (€4.17/mo — save 30%)
    yearlyMonthly: 417,
    dbKeyMonthly: "buyer_plus",
    dbKeyYearly: "buyer_plus_yearly",
    popular: true,
    features: [
      "Everything in Free",
      "Unlimited saved listings",
      "Price drop alerts",
      "Saved search notifications",
      "See listing view counts",
      "Early access to new listings",
      "Priority support",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    tagline: "The ultimate buyer experience",
    monthlyAmount: 1199, // €11.99  (infra cost ≈ €0.10 → 99 % margin)
    yearlyAmount: 9999, // €99.99 (€8.33/mo — save 31%)
    yearlyMonthly: 833,
    dbKeyMonthly: "buyer_premium",
    dbKeyYearly: "buyer_premium_yearly",
    features: [
      "Everything in Plus",
      "AI price advisor",
      "Vehicle history reports",
      "Buyer protection guarantee",
      "No platform fees on offers",
      "VIP badge on profile",
      "Dedicated support line",
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format cents to a display price (e.g. 2500 → "€25", 499 → "€4.99") */
export function formatEur(cents: number): string {
  if (cents === 0) return "Free";
  const euros = cents / 100;
  return euros % 1 === 0 ? `€${euros}` : `€${euros.toFixed(2)}`;
}

/** Calculate yearly savings percentage vs monthly */
export function yearlySavings(monthly: number, yearlyTotal: number): number {
  if (monthly === 0) return 0;
  const fullYear = monthly * 12;
  return Math.round(((fullYear - yearlyTotal) / fullYear) * 100);
}
