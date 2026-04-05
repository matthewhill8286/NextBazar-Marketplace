/**
 * Plan limit enforcement for seller tiers.
 *
 * Used by both server (API routes) and client (dashboard UI) to determine
 * what a seller on a given plan tier can and cannot do.
 */

import type { SellerTier } from "@/lib/pricing-config";
import { SELLER_PLANS } from "@/lib/pricing-config";

export type PlanLimits = {
  tier: SellerTier;
  tierLabel: string;
  activeListings: number | "unlimited";
  imagesPerListing: number;
  freeBoostsPerMonth: number;
  teamMembers: number;
  /** Features gated by plan */
  csvImport: boolean;
  stockManagement: boolean;
  aiDescriptions: boolean;
  brandedShop: boolean;
  analytics: boolean;
  advancedAnalytics: boolean;
  verifiedBadge: boolean;
  homepageFeatured: boolean;
  videoTours: boolean;
  quickReplyTemplates: boolean;
  prioritySearch: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
};

/**
 * Get the feature limits for a given seller plan tier.
 * Falls back to "starter" if an unknown tier is provided.
 */
export function getPlanLimits(tier: string): PlanLimits {
  const safeTier = (
    ["starter", "pro", "business"].includes(tier) ? tier : "starter"
  ) as SellerTier;

  const plan = SELLER_PLANS.find((p) => p.key === safeTier)!;

  return {
    tier: safeTier,
    tierLabel: plan.name,
    activeListings: plan.limits.activeListings,
    imagesPerListing: plan.limits.images,
    freeBoostsPerMonth: plan.limits.boostsPerMonth,
    teamMembers: plan.limits.teamMembers,

    // Feature gates per tier
    csvImport: safeTier === "business",
    stockManagement: safeTier === "business",
    aiDescriptions: safeTier === "business",
    brandedShop: safeTier === "pro" || safeTier === "business",
    analytics: safeTier === "pro" || safeTier === "business",
    advancedAnalytics: safeTier === "business",
    verifiedBadge: safeTier === "business",
    homepageFeatured: safeTier === "business",
    videoTours: safeTier === "business",
    quickReplyTemplates: safeTier === "pro" || safeTier === "business",
    prioritySearch: safeTier === "pro" || safeTier === "business",
    prioritySupport: safeTier === "pro" || safeTier === "business",
    dedicatedManager: safeTier === "business",
  };
}

/**
 * Check if a seller has reached their active listing limit.
 * @returns true if they can create more listings, false if at the limit.
 */
export function canCreateListing(
  tier: string,
  currentActiveCount: number,
): boolean {
  const limits = getPlanLimits(tier);
  if (limits.activeListings === "unlimited") return true;
  return currentActiveCount < limits.activeListings;
}

/**
 * Get upgrade suggestion text for a feature gate.
 */
export function upgradeMessage(
  currentTier: string,
  feature: string,
): string | null {
  const tier = currentTier as SellerTier;
  if (tier === "business") return null; // Already on highest tier

  const nextTier = tier === "starter" ? "Pro" : "Business";
  return `Upgrade to ${nextTier} to unlock ${feature}`;
}
