/**
 * Tests for the multi-tier seller plan helpers in lib/stripe.ts.
 * Validates getSellerPlan() and getAllSellerPlans() resolve the correct
 * pricing from the DB (mocked) and fall back to config defaults.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — getPricingMap is the only DB call these helpers make
// ---------------------------------------------------------------------------

const { mockGetPricingMap } = vi.hoisted(() => ({
  mockGetPricingMap: vi.fn(),
}));

vi.mock("@/lib/supabase/queries", () => ({
  getPricingMap: mockGetPricingMap,
}));

// Stripe SDK isn't used by the plan helpers, but the module imports it
vi.mock("stripe", () => ({
  default: class StripeMock {
    constructor() {}
  },
}));

// ---------------------------------------------------------------------------

import { getSellerPlan, getAllSellerPlans, formatPrice } from "@/lib/stripe";

// A minimal mock pricing map matching the DB shape
function makePricingMap(overrides: Record<string, object> = {}) {
  return {
    dealer_pro: {
      key: "dealer_pro",
      name: "Pro",
      description: "Professional seller",
      amount: 2900,
      interval: "monthly",
      duration_days: 30,
      stripe_price_id: "price_pro_monthly",
      ...overrides.dealer_pro,
    },
    dealer_pro_yearly: {
      key: "dealer_pro_yearly",
      name: "Pro Yearly",
      description: "Professional seller — annual",
      amount: 28800,
      interval: "yearly",
      duration_days: 365,
      stripe_price_id: "price_pro_yearly",
      ...overrides.dealer_pro_yearly,
    },
    dealer_business: {
      key: "dealer_business",
      name: "Business",
      description: "High-volume dealer",
      amount: 8900,
      interval: "monthly",
      duration_days: 30,
      stripe_price_id: "price_biz_monthly",
      ...overrides.dealer_business,
    },
    dealer_business_yearly: {
      key: "dealer_business_yearly",
      name: "Business Yearly",
      description: "High-volume dealer — annual",
      amount: 82800,
      interval: "yearly",
      duration_days: 365,
      stripe_price_id: "price_biz_yearly",
      ...overrides.dealer_business_yearly,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPricingMap.mockResolvedValue(makePricingMap());
});

// ---------------------------------------------------------------------------

describe("getSellerPlan", () => {
  it("defaults to pro monthly when called without arguments", async () => {
    const plan = await getSellerPlan();

    expect(plan.tier).toBe("pro");
    expect(plan.billingCycle).toBe("monthly");
    expect(plan.amount).toBe(2900);
    expect(plan.interval).toBe("month");
    expect(plan.priceId).toBe("price_pro_monthly");
    expect(plan.dbKey).toBe("dealer_pro");
  });

  it("resolves pro yearly plan", async () => {
    const plan = await getSellerPlan("pro", "yearly");

    expect(plan.tier).toBe("pro");
    expect(plan.billingCycle).toBe("yearly");
    expect(plan.amount).toBe(28800);
    expect(plan.interval).toBe("year");
    expect(plan.priceId).toBe("price_pro_yearly");
    expect(plan.dbKey).toBe("dealer_pro_yearly");
  });

  it("resolves business monthly plan", async () => {
    const plan = await getSellerPlan("business", "monthly");

    expect(plan.tier).toBe("business");
    expect(plan.billingCycle).toBe("monthly");
    expect(plan.amount).toBe(8900);
    expect(plan.interval).toBe("month");
    expect(plan.priceId).toBe("price_biz_monthly");
  });

  it("resolves business yearly plan", async () => {
    const plan = await getSellerPlan("business", "yearly");

    expect(plan.tier).toBe("business");
    expect(plan.billingCycle).toBe("yearly");
    expect(plan.amount).toBe(82800);
    expect(plan.interval).toBe("year");
    expect(plan.priceId).toBe("price_biz_yearly");
  });

  it("falls back to config amount when DB row is missing", async () => {
    // Remove dealer_pro from the map
    mockGetPricingMap.mockResolvedValue({});

    const plan = await getSellerPlan("pro", "monthly");

    // Should fall back to SELLER_PLANS config: 2900 cents
    expect(plan.amount).toBe(2900);
    expect(plan.priceId).toBe(""); // No stripe_price_id
  });

  it("falls back to config amount for yearly when DB row is missing", async () => {
    mockGetPricingMap.mockResolvedValue({});

    const plan = await getSellerPlan("business", "yearly");

    // Should fall back to SELLER_PLANS config: 82800 cents
    expect(plan.amount).toBe(82800);
    expect(plan.priceId).toBe("");
  });

  it("throws for unknown tier", async () => {
    await expect(
      getSellerPlan("enterprise" as never, "monthly"),
    ).rejects.toThrow("Unknown seller tier: enterprise");
  });

  it("returns empty priceId when stripe_price_id is null", async () => {
    mockGetPricingMap.mockResolvedValue(
      makePricingMap({
        dealer_pro: { stripe_price_id: null },
      }),
    );

    const plan = await getSellerPlan("pro", "monthly");
    expect(plan.priceId).toBe("");
  });
});

describe("getAllSellerPlans", () => {
  it("returns 4 plans (pro + business × monthly + yearly)", async () => {
    const plans = await getAllSellerPlans();

    expect(plans).toHaveLength(4);
  });

  it("returns plans in correct order", async () => {
    const plans = await getAllSellerPlans();

    expect(plans[0].tier).toBe("pro");
    expect(plans[0].billingCycle).toBe("monthly");
    expect(plans[1].tier).toBe("pro");
    expect(plans[1].billingCycle).toBe("yearly");
    expect(plans[2].tier).toBe("business");
    expect(plans[2].billingCycle).toBe("monthly");
    expect(plans[3].tier).toBe("business");
    expect(plans[3].billingCycle).toBe("yearly");
  });

  it("each plan has required fields", async () => {
    const plans = await getAllSellerPlans();

    for (const plan of plans) {
      expect(plan.tier).toBeDefined();
      expect(plan.billingCycle).toBeDefined();
      expect(plan.amount).toBeGreaterThan(0);
      expect(plan.interval).toMatch(/^(month|year)$/);
      expect(plan.name).toBeTruthy();
      expect(plan.dbKey).toBeTruthy();
    }
  });
});

describe("formatPrice", () => {
  it("formats whole euro amounts without decimals", () => {
    expect(formatPrice(2900)).toBe("€29");
    expect(formatPrice(8900)).toBe("€89");
    expect(formatPrice(100)).toBe("€1");
  });

  it("formats fractional amounts with decimals", () => {
    expect(formatPrice(499)).toBe("€4.99");
    expect(formatPrice(2450)).toBe("€24.5");
  });

  it("formats zero as €0", () => {
    expect(formatPrice(0)).toBe("€0");
  });
});
