import { describe, expect, it } from "vitest";
import {
  getPlanLimits,
  canCreateListing,
  upgradeMessage,
} from "@/lib/plan-limits";

describe("getPlanLimits", () => {
  it("returns starter limits for 'starter' tier", () => {
    const limits = getPlanLimits("starter");

    expect(limits.tier).toBe("starter");
    expect(limits.tierLabel).toBe("Starter");
    expect(limits.activeListings).toBe(10);
    expect(limits.imagesPerListing).toBe(2);
    expect(limits.freeBoostsPerMonth).toBe(0);
    expect(limits.teamMembers).toBe(1);
  });

  it("gates all premium features off for starter", () => {
    const limits = getPlanLimits("starter");

    expect(limits.csvImport).toBe(false);
    expect(limits.stockManagement).toBe(false);
    expect(limits.aiDescriptions).toBe(false);
    expect(limits.brandedShop).toBe(false);
    expect(limits.analytics).toBe(false);
    expect(limits.advancedAnalytics).toBe(false);
    expect(limits.verifiedBadge).toBe(false);
    expect(limits.homepageFeatured).toBe(false);
    expect(limits.videoTours).toBe(false);
    expect(limits.quickReplyTemplates).toBe(false);
    expect(limits.prioritySearch).toBe(false);
    expect(limits.prioritySupport).toBe(false);
    expect(limits.dedicatedManager).toBe(false);
  });

  it("returns pro limits for 'pro' tier", () => {
    const limits = getPlanLimits("pro");

    expect(limits.tier).toBe("pro");
    expect(limits.tierLabel).toBe("Pro");
    expect(limits.activeListings).toBe("unlimited");
    expect(limits.imagesPerListing).toBe(10);
    expect(limits.freeBoostsPerMonth).toBe(3);
    expect(limits.teamMembers).toBe(1);
  });

  it("enables pro-level features for 'pro' tier", () => {
    const limits = getPlanLimits("pro");

    expect(limits.brandedShop).toBe(true);
    expect(limits.analytics).toBe(true);
    expect(limits.quickReplyTemplates).toBe(true);
    expect(limits.prioritySearch).toBe(true);
    expect(limits.prioritySupport).toBe(true);
  });

  it("gates business-only features off for pro tier", () => {
    const limits = getPlanLimits("pro");

    expect(limits.csvImport).toBe(false);
    expect(limits.stockManagement).toBe(false);
    expect(limits.aiDescriptions).toBe(false);
    expect(limits.advancedAnalytics).toBe(false);
    expect(limits.verifiedBadge).toBe(false);
    expect(limits.homepageFeatured).toBe(false);
    expect(limits.videoTours).toBe(false);
    expect(limits.dedicatedManager).toBe(false);
  });

  it("returns business limits for 'business' tier", () => {
    const limits = getPlanLimits("business");

    expect(limits.tier).toBe("business");
    expect(limits.tierLabel).toBe("Business");
    expect(limits.activeListings).toBe("unlimited");
    expect(limits.imagesPerListing).toBe(20);
    expect(limits.freeBoostsPerMonth).toBe(10);
    expect(limits.teamMembers).toBe(5);
  });

  it("enables all features for business tier", () => {
    const limits = getPlanLimits("business");

    expect(limits.csvImport).toBe(true);
    expect(limits.stockManagement).toBe(true);
    expect(limits.aiDescriptions).toBe(true);
    expect(limits.brandedShop).toBe(true);
    expect(limits.analytics).toBe(true);
    expect(limits.advancedAnalytics).toBe(true);
    expect(limits.verifiedBadge).toBe(true);
    expect(limits.homepageFeatured).toBe(true);
    expect(limits.videoTours).toBe(true);
    expect(limits.quickReplyTemplates).toBe(true);
    expect(limits.prioritySearch).toBe(true);
    expect(limits.prioritySupport).toBe(true);
    expect(limits.dedicatedManager).toBe(true);
  });

  it("falls back to starter for unknown tier values", () => {
    const limits = getPlanLimits("enterprise");

    expect(limits.tier).toBe("starter");
    expect(limits.tierLabel).toBe("Starter");
    expect(limits.activeListings).toBe(10);
  });

  it("falls back to starter for empty string", () => {
    const limits = getPlanLimits("");

    expect(limits.tier).toBe("starter");
  });
});

describe("canCreateListing", () => {
  it("returns true for starter tier under the limit", () => {
    expect(canCreateListing("starter", 5)).toBe(true);
  });

  it("returns true for starter tier at one below the limit", () => {
    expect(canCreateListing("starter", 9)).toBe(true);
  });

  it("returns false for starter tier at the limit", () => {
    expect(canCreateListing("starter", 10)).toBe(false);
  });

  it("returns false for starter tier above the limit", () => {
    expect(canCreateListing("starter", 15)).toBe(false);
  });

  it("always returns true for pro tier (unlimited)", () => {
    expect(canCreateListing("pro", 0)).toBe(true);
    expect(canCreateListing("pro", 100)).toBe(true);
    expect(canCreateListing("pro", 9999)).toBe(true);
  });

  it("always returns true for business tier (unlimited)", () => {
    expect(canCreateListing("business", 500)).toBe(true);
  });

  it("falls back to starter limits for unknown tier", () => {
    expect(canCreateListing("unknown", 10)).toBe(false);
    expect(canCreateListing("unknown", 5)).toBe(true);
  });
});

describe("upgradeMessage", () => {
  it("suggests Pro for starter tier", () => {
    const msg = upgradeMessage("starter", "CSV import");
    expect(msg).toBe("Upgrade to Pro to unlock CSV import");
  });

  it("suggests Business for pro tier", () => {
    const msg = upgradeMessage("pro", "AI descriptions");
    expect(msg).toBe("Upgrade to Business to unlock AI descriptions");
  });

  it("returns null for business tier (already highest)", () => {
    const msg = upgradeMessage("business", "anything");
    expect(msg).toBeNull();
  });
});
