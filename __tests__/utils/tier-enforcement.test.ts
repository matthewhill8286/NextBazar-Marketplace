/**
 * Tier enforcement tests — verifies that seller plan limits are correctly
 * applied across the platform. Tests cover:
 *   1. Listing limits per tier
 *   2. Image limits per tier
 *   3. Feature gates (CSV import, stock mgmt, AI, branding, analytics)
 *   4. Upgrade messaging
 *   5. Edge cases (null/undefined tiers, boundary values)
 */

import { describe, expect, it } from "vitest";
import {
  canCreateListing,
  getPlanLimits,
  upgradeMessage,
  type PlanLimits,
} from "@/lib/plan-limits";
import { SELLER_PLANS, type SellerTier } from "@/lib/pricing-config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIERS: SellerTier[] = ["starter", "pro", "business"];

function limitsFor(tier: SellerTier): PlanLimits {
  return getPlanLimits(tier);
}

// ─── 1. Listing limits ──────────────────────────────────────────────────────

describe("listing limits enforcement", () => {
  it("starter tier has exactly 10 active listings", () => {
    const limits = limitsFor("starter");
    expect(limits.activeListings).toBe(10);
  });

  it("pro tier has unlimited active listings", () => {
    const limits = limitsFor("pro");
    expect(limits.activeListings).toBe("unlimited");
  });

  it("business tier has unlimited active listings", () => {
    const limits = limitsFor("business");
    expect(limits.activeListings).toBe("unlimited");
  });

  it("canCreateListing blocks starter at exactly 10", () => {
    expect(canCreateListing("starter", 9)).toBe(true);
    expect(canCreateListing("starter", 10)).toBe(false);
    expect(canCreateListing("starter", 11)).toBe(false);
  });

  it("canCreateListing allows starter at 0", () => {
    expect(canCreateListing("starter", 0)).toBe(true);
  });

  it("canCreateListing never blocks pro", () => {
    expect(canCreateListing("pro", 0)).toBe(true);
    expect(canCreateListing("pro", 500)).toBe(true);
    expect(canCreateListing("pro", 10000)).toBe(true);
  });

  it("canCreateListing never blocks business", () => {
    expect(canCreateListing("business", 0)).toBe(true);
    expect(canCreateListing("business", 1000)).toBe(true);
  });

  it("listing limits match SELLER_PLANS config", () => {
    for (const plan of SELLER_PLANS) {
      const limits = limitsFor(plan.key);
      expect(limits.activeListings).toBe(plan.limits.activeListings);
    }
  });
});

// ─── 2. Image limits ────────────────────────────────────────────────────────

describe("image limits per tier", () => {
  it("starter tier allows 2 images per listing", () => {
    expect(limitsFor("starter").imagesPerListing).toBe(2);
  });

  it("pro tier allows 10 images per listing", () => {
    expect(limitsFor("pro").imagesPerListing).toBe(10);
  });

  it("business tier allows 20 images per listing", () => {
    expect(limitsFor("business").imagesPerListing).toBe(20);
  });

  it("each tier has strictly more images than the one below", () => {
    const starter = limitsFor("starter").imagesPerListing;
    const pro = limitsFor("pro").imagesPerListing;
    const business = limitsFor("business").imagesPerListing;

    expect(pro).toBeGreaterThan(starter);
    expect(business).toBeGreaterThan(pro);
  });

  it("image limits match SELLER_PLANS config", () => {
    for (const plan of SELLER_PLANS) {
      const limits = limitsFor(plan.key);
      expect(limits.imagesPerListing).toBe(plan.limits.images);
    }
  });
});

// ─── 3. Boost limits ────────────────────────────────────────────────────────

describe("boost limits per tier", () => {
  it("starter gets 0 free boosts per month", () => {
    expect(limitsFor("starter").freeBoostsPerMonth).toBe(0);
  });

  it("pro gets 3 free boosts per month", () => {
    expect(limitsFor("pro").freeBoostsPerMonth).toBe(3);
  });

  it("business gets 10 free boosts per month", () => {
    expect(limitsFor("business").freeBoostsPerMonth).toBe(10);
  });
});

// ─── 4. Team member limits ──────────────────────────────────────────────────

describe("team member limits per tier", () => {
  it("starter has 1 team member (just the owner)", () => {
    expect(limitsFor("starter").teamMembers).toBe(1);
  });

  it("pro has 1 team member", () => {
    expect(limitsFor("pro").teamMembers).toBe(1);
  });

  it("business has 5 team members", () => {
    expect(limitsFor("business").teamMembers).toBe(5);
  });
});

// ─── 5. Feature gates — Business-only features ─────────────────────────────

describe("business-only feature gates", () => {
  const businessOnly: (keyof PlanLimits)[] = [
    "csvImport",
    "stockManagement",
    "aiDescriptions",
    "advancedAnalytics",
    "verifiedBadge",
    "homepageFeatured",
    "videoTours",
    "dedicatedManager",
  ];

  for (const feature of businessOnly) {
    it(`${feature} is OFF for starter`, () => {
      expect(limitsFor("starter")[feature]).toBe(false);
    });

    it(`${feature} is OFF for pro`, () => {
      expect(limitsFor("pro")[feature]).toBe(false);
    });

    it(`${feature} is ON for business`, () => {
      expect(limitsFor("business")[feature]).toBe(true);
    });
  }
});

// ─── 6. Feature gates — Pro+ features (pro and business) ───────────────────

describe("pro-and-above feature gates", () => {
  const proFeatures: (keyof PlanLimits)[] = [
    "brandedShop",
    "analytics",
    "quickReplyTemplates",
    "prioritySearch",
    "prioritySupport",
  ];

  for (const feature of proFeatures) {
    it(`${feature} is OFF for starter`, () => {
      expect(limitsFor("starter")[feature]).toBe(false);
    });

    it(`${feature} is ON for pro`, () => {
      expect(limitsFor("pro")[feature]).toBe(true);
    });

    it(`${feature} is ON for business`, () => {
      expect(limitsFor("business")[feature]).toBe(true);
    });
  }
});

// ─── 7. Tier escalation — each tier is a strict superset of the one below ──

describe("tier escalation (superset guarantee)", () => {
  it("pro has all starter features plus more", () => {
    const starter = limitsFor("starter");
    const pro = limitsFor("pro");

    // Everything true in starter must be true in pro
    for (const key of Object.keys(starter) as (keyof PlanLimits)[]) {
      if (typeof starter[key] === "boolean" && starter[key] === true) {
        expect(pro[key]).toBe(true);
      }
    }
  });

  it("business has all pro features plus more", () => {
    const pro = limitsFor("pro");
    const business = limitsFor("business");

    // Everything true in pro must be true in business
    for (const key of Object.keys(pro) as (keyof PlanLimits)[]) {
      if (typeof pro[key] === "boolean" && pro[key] === true) {
        expect(business[key]).toBe(true);
      }
    }
  });

  it("business has strictly more boolean features than pro", () => {
    const pro = limitsFor("pro");
    const business = limitsFor("business");

    const proTrueCount = Object.values(pro).filter((v) => v === true).length;
    const bizTrueCount = Object.values(business).filter(
      (v) => v === true,
    ).length;

    expect(bizTrueCount).toBeGreaterThan(proTrueCount);
  });

  it("pro has strictly more boolean features than starter", () => {
    const starter = limitsFor("starter");
    const pro = limitsFor("pro");

    const starterTrueCount = Object.values(starter).filter(
      (v) => v === true,
    ).length;
    const proTrueCount = Object.values(pro).filter((v) => v === true).length;

    expect(proTrueCount).toBeGreaterThan(starterTrueCount);
  });
});

// ─── 8. Upgrade messaging ───────────────────────────────────────────────────

describe("upgrade messaging per tier", () => {
  it("starter is told to upgrade to Pro", () => {
    const msg = upgradeMessage("starter", "branded shop");
    expect(msg).toContain("Pro");
    expect(msg).toContain("branded shop");
  });

  it("pro is told to upgrade to Business", () => {
    const msg = upgradeMessage("pro", "CSV import");
    expect(msg).toContain("Business");
    expect(msg).toContain("CSV import");
  });

  it("business gets no upgrade message (already highest)", () => {
    expect(upgradeMessage("business", "anything")).toBeNull();
  });

  it("upgrade message includes the feature name", () => {
    const features = [
      "analytics",
      "stock management",
      "AI descriptions",
      "CSV import",
    ];
    for (const feature of features) {
      const msg = upgradeMessage("starter", feature);
      expect(msg).toContain(feature);
    }
  });
});

// ─── 9. Edge cases and safety ───────────────────────────────────────────────

describe("edge cases and tier safety", () => {
  it("unknown tier falls back to starter", () => {
    const limits = getPlanLimits("enterprise" as string);
    expect(limits.tier).toBe("starter");
    expect(limits.activeListings).toBe(10);
    expect(limits.csvImport).toBe(false);
  });

  it("empty string falls back to starter", () => {
    const limits = getPlanLimits("");
    expect(limits.tier).toBe("starter");
  });

  it("null-ish value falls back to starter", () => {
    const limits = getPlanLimits(undefined as unknown as string);
    expect(limits.tier).toBe("starter");
  });

  it("canCreateListing handles zero count", () => {
    expect(canCreateListing("starter", 0)).toBe(true);
  });

  it("canCreateListing handles negative count gracefully", () => {
    expect(canCreateListing("starter", -1)).toBe(true);
  });

  it("canCreateListing handles unknown tier with boundary count", () => {
    // Unknown tier → starter → 10 limit
    expect(canCreateListing("unknown", 10)).toBe(false);
    expect(canCreateListing("unknown", 9)).toBe(true);
  });

  it("all SELLER_PLANS keys are recognized tiers", () => {
    for (const plan of SELLER_PLANS) {
      const limits = getPlanLimits(plan.key);
      expect(limits.tier).toBe(plan.key);
    }
  });

  it("every tier has a non-empty tierLabel", () => {
    for (const tier of TIERS) {
      expect(limitsFor(tier).tierLabel).toBeTruthy();
      expect(limitsFor(tier).tierLabel.length).toBeGreaterThan(0);
    }
  });
});

// ─── 10. Pricing config consistency ─────────────────────────────────────────

describe("plan-limits consistency with pricing-config", () => {
  it("every SELLER_PLAN has a corresponding getPlanLimits entry", () => {
    for (const plan of SELLER_PLANS) {
      const limits = getPlanLimits(plan.key);
      expect(limits.tier).toBe(plan.key);
      expect(limits.tierLabel).toBe(plan.name);
    }
  });

  it("starter plan is free (0 cost)", () => {
    const starterPlan = SELLER_PLANS.find((p) => p.key === "starter");
    expect(starterPlan).toBeDefined();
    expect(starterPlan!.monthlyAmount).toBe(0);
    expect(starterPlan!.yearlyAmount).toBe(0);
  });

  it("paid plans have non-zero prices", () => {
    for (const plan of SELLER_PLANS.filter((p) => p.key !== "starter")) {
      expect(plan.monthlyAmount).toBeGreaterThan(0);
      expect(plan.yearlyAmount).toBeGreaterThan(0);
    }
  });

  it("yearly billing is cheaper per month than monthly billing", () => {
    for (const plan of SELLER_PLANS.filter((p) => p.key !== "starter")) {
      expect(plan.yearlyMonthly).toBeLessThan(plan.monthlyAmount);
    }
  });
});
