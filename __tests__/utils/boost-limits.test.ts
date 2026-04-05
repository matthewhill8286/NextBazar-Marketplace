import { describe, expect, it } from "vitest";
import { getPlanLimits } from "@/lib/plan-limits";
import { SELLER_PLANS } from "@/lib/pricing-config";

// ---------------------------------------------------------------------------
// Boost allowance per tier
// ---------------------------------------------------------------------------

describe("boost limits per tier", () => {
  it("starter tier gets 0 free boosts per month", () => {
    const limits = getPlanLimits("starter");
    expect(limits.freeBoostsPerMonth).toBe(0);
  });

  it("pro tier gets 3 free boosts per month", () => {
    const limits = getPlanLimits("pro");
    expect(limits.freeBoostsPerMonth).toBe(3);
  });

  it("business tier gets 10 free boosts per month", () => {
    const limits = getPlanLimits("business");
    expect(limits.freeBoostsPerMonth).toBe(10);
  });

  it("unknown tier falls back to starter (0 boosts)", () => {
    const limits = getPlanLimits("enterprise");
    expect(limits.freeBoostsPerMonth).toBe(0);
  });

  it("SELLER_PLANS config matches getPlanLimits for all tiers", () => {
    for (const plan of SELLER_PLANS) {
      const limits = getPlanLimits(plan.key);
      expect(limits.freeBoostsPerMonth).toBe(plan.limits.boostsPerMonth);
    }
  });
});

// ---------------------------------------------------------------------------
// Cycle-aware boost counting logic (pure function tests)
// ---------------------------------------------------------------------------

/**
 * Replicates the cycle-aware counting logic used in PromoUsageBar
 * and promote-client.tsx: count listings with promoted_at >= cycleStart.
 */
function countCycleBoosts(
  listings: Array<{ promoted_at?: string | null; is_promoted: boolean }>,
  planStartedAt: string | null,
): number {
  if (!planStartedAt) {
    // Fallback: count currently promoted
    return listings.filter((l) => l.is_promoted).length;
  }
  const cycleStart = new Date(planStartedAt).getTime();
  return listings.filter(
    (l) => l.promoted_at && new Date(l.promoted_at).getTime() >= cycleStart,
  ).length;
}

function remainingBoosts(tier: string, usedInCycle: number): number {
  const limits = getPlanLimits(tier);
  return Math.max(limits.freeBoostsPerMonth - usedInCycle, 0);
}

describe("cycle-aware boost counting", () => {
  const now = new Date();
  const cycleStart = new Date(now.getTime() - 15 * 86400000).toISOString(); // 15 days ago
  const beforeCycle = new Date(now.getTime() - 45 * 86400000).toISOString(); // 45 days ago (previous cycle)
  const duringCycle = new Date(now.getTime() - 5 * 86400000).toISOString(); // 5 days ago (this cycle)

  it("counts only boosts activated during the current billing cycle", () => {
    const listings = [
      { promoted_at: duringCycle, is_promoted: true },
      { promoted_at: beforeCycle, is_promoted: false }, // expired, from previous cycle
      { promoted_at: duringCycle, is_promoted: true },
    ];

    expect(countCycleBoosts(listings, cycleStart)).toBe(2);
  });

  it("excludes boosts from before the cycle start", () => {
    const listings = [
      { promoted_at: beforeCycle, is_promoted: true }, // still active but from previous cycle
      { promoted_at: beforeCycle, is_promoted: false }, // expired, previous cycle
    ];

    expect(countCycleBoosts(listings, cycleStart)).toBe(0);
  });

  it("counts boosts at exactly the cycle start time", () => {
    const listings = [
      { promoted_at: cycleStart, is_promoted: true },
    ];

    expect(countCycleBoosts(listings, cycleStart)).toBe(1);
  });

  it("falls back to is_promoted count when planStartedAt is null", () => {
    const listings = [
      { promoted_at: duringCycle, is_promoted: true },
      { promoted_at: null, is_promoted: false },
      { promoted_at: beforeCycle, is_promoted: true },
    ];

    // Without cycle info, just count currently promoted
    expect(countCycleBoosts(listings, null)).toBe(2);
  });

  it("returns 0 when no listings exist", () => {
    expect(countCycleBoosts([], cycleStart)).toBe(0);
  });

  it("handles listings with no promoted_at (never promoted)", () => {
    const listings = [
      { promoted_at: null, is_promoted: false },
      { promoted_at: undefined, is_promoted: false },
    ];

    expect(countCycleBoosts(listings, cycleStart)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Remaining boost calculation
// ---------------------------------------------------------------------------

describe("remaining boosts calculation", () => {
  it("pro tier with 0 used has 3 remaining", () => {
    expect(remainingBoosts("pro", 0)).toBe(3);
  });

  it("pro tier with 2 used has 1 remaining", () => {
    expect(remainingBoosts("pro", 2)).toBe(1);
  });

  it("pro tier with 3 used has 0 remaining", () => {
    expect(remainingBoosts("pro", 3)).toBe(0);
  });

  it("pro tier with more than 3 used (paid extra) still shows 0", () => {
    expect(remainingBoosts("pro", 5)).toBe(0);
  });

  it("business tier with 0 used has 10 remaining", () => {
    expect(remainingBoosts("business", 0)).toBe(10);
  });

  it("business tier with 7 used has 3 remaining", () => {
    expect(remainingBoosts("business", 7)).toBe(3);
  });

  it("business tier with 10 used has 0 remaining", () => {
    expect(remainingBoosts("business", 10)).toBe(0);
  });

  it("starter tier always has 0 remaining regardless of usage", () => {
    expect(remainingBoosts("starter", 0)).toBe(0);
    expect(remainingBoosts("starter", 5)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Billing cycle reset behavior
// ---------------------------------------------------------------------------

describe("billing cycle reset", () => {
  it("new cycle start date resets the boost count", () => {
    const oldCycleStart = new Date("2026-03-01T00:00:00Z").toISOString();
    const newCycleStart = new Date("2026-04-01T00:00:00Z").toISOString();
    const boostInMarch = new Date("2026-03-15T00:00:00Z").toISOString();
    const boostInApril = new Date("2026-04-05T00:00:00Z").toISOString();

    const listings = [
      { promoted_at: boostInMarch, is_promoted: false },
      { promoted_at: boostInMarch, is_promoted: false },
      { promoted_at: boostInApril, is_promoted: true },
    ];

    // Under old cycle: all 3 count
    expect(countCycleBoosts(listings, oldCycleStart)).toBe(3);

    // Under new cycle: only April boost counts
    expect(countCycleBoosts(listings, newCycleStart)).toBe(1);

    // So a Business user with 10 boosts/month would have:
    expect(remainingBoosts("business", countCycleBoosts(listings, newCycleStart))).toBe(9);
  });

  it("yearly billing cycle start still works correctly", () => {
    const yearStart = new Date("2026-01-01T00:00:00Z").toISOString();
    const marchBoost = new Date("2026-03-15T00:00:00Z").toISOString();

    const listings = [
      { promoted_at: marchBoost, is_promoted: true },
    ];

    expect(countCycleBoosts(listings, yearStart)).toBe(1);
    expect(remainingBoosts("pro", 1)).toBe(2);
  });
});
