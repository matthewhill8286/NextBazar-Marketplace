import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Price IDs from Stripe
export const PROMOTION_PRICES = {
  featured: {
    priceId: "price_1TD6LxI6t3gE5tEXGDty8s9J",
    name: "Featured Listing",
    description: "Top placement + highlighted for 7 days",
    amount: 999,
    duration: 7, // days
  },
  urgent: {
    priceId: "price_1TD6M3I6t3gE5tEXMP3hRen1",
    name: "Urgent Badge",
    description: "Urgent badge + priority in search for 3 days",
    amount: 699,
    duration: 3, // days
  },
} as const;

export type PromotionType = keyof typeof PROMOTION_PRICES;
