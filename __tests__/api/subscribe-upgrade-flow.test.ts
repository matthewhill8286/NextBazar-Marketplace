/**
 * Tests for POST /api/dealer/subscribe — upgrade flow.
 * When an existing shop subscribes to a higher tier, the success_url
 * should skip onboarding and redirect to dashboard instead.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dealer/subscribe/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockSessionCreate,
  mockCustomerCreate,
  mockGetSellerPlan,
  mockRequireAuth,
  mockSelect,
  mockEq,
  mockSingle,
} = vi.hoisted(() => ({
  mockSessionCreate: vi.fn(),
  mockCustomerCreate: vi.fn(),
  mockGetSellerPlan: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: mockSessionCreate } },
    customers: { create: mockCustomerCreate },
    products: { create: vi.fn().mockResolvedValue({ id: "prod_x" }) },
    prices: { create: vi.fn().mockResolvedValue({ id: "price_x" }) },
  },
  getSellerPlan: mockGetSellerPlan,
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: mockRequireAuth,
  getUserId: vi.fn(async () => {
    const result = await mockRequireAuth();
    return result.userId ?? null;
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

vi.mock("@/lib/pricing-config", async () => {
  const actual = await vi.importActual("@/lib/pricing-config");
  return actual;
});

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/dealer/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockUser = { id: "user-upgrade", email: "upgrade@test.com" };

beforeEach(() => {
  vi.clearAllMocks();

  mockRequireAuth.mockResolvedValue({ userId: mockUser.id });

  mockGetSellerPlan.mockResolvedValue({
    priceId: "price_biz_monthly",
    dbKey: "dealer_business",
    name: "Business",
    description: "Business seller",
    amount: 8900,
    interval: "month",
    tier: "business",
    billingCycle: "monthly",
  });

  mockSessionCreate.mockResolvedValue({
    url: "https://checkout.stripe.com/upgrade",
  });

  mockCustomerCreate.mockResolvedValue({ id: "cus_new" });
});

function setupExistingShop(shopData: Record<string, unknown> | null) {
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({ data: shopData });
}

// ---------------------------------------------------------------------------

describe("POST /api/dealer/subscribe — upgrade flow", () => {
  it("sends new users (no shop) to shop-onboarding", async () => {
    setupExistingShop(null);

    await POST(
      makeRequest({ origin: "http://localhost:3000", tier: "pro", billing: "monthly" }),
    );

    const sessionArgs = mockSessionCreate.mock.calls[0][0];
    expect(sessionArgs.success_url).toContain("/shop-onboarding");
    expect(sessionArgs.success_url).not.toContain("/dashboard");
  });

  it("sends existing shop (with shop_name) to dashboard on upgrade", async () => {
    setupExistingShop({
      stripe_customer_id: "cus_existing",
      plan_status: "active",
      plan_tier: "pro",
      shop_name: "Premium Homes",
      slug: "premium-homes",
    });

    await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "business",
        billing: "monthly",
      }),
    );

    const sessionArgs = mockSessionCreate.mock.calls[0][0];
    expect(sessionArgs.success_url).toContain("/dashboard");
    expect(sessionArgs.success_url).toContain("upgraded=true");
    expect(sessionArgs.success_url).not.toContain("/shop-onboarding");
  });

  it("sends shop without name (unconfigured) to onboarding", async () => {
    // Shop record exists but no shop_name (never completed onboarding)
    setupExistingShop({
      stripe_customer_id: "cus_unconfigured",
      plan_status: "active",
      plan_tier: "starter",
      shop_name: null,
      slug: "abc12345",
    });

    await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "pro",
        billing: "monthly",
      }),
    );

    const sessionArgs = mockSessionCreate.mock.calls[0][0];
    expect(sessionArgs.success_url).toContain("/shop-onboarding");
  });

  it("reuses existing Stripe customer ID on upgrade", async () => {
    setupExistingShop({
      stripe_customer_id: "cus_reuse_me",
      plan_status: "active",
      plan_tier: "pro",
      shop_name: "Test Shop",
      slug: "test-shop",
    });

    await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "business",
        billing: "yearly",
      }),
    );

    // Should not create a new customer
    expect(mockCustomerCreate).not.toHaveBeenCalled();

    // Should use the existing customer ID
    const sessionArgs = mockSessionCreate.mock.calls[0][0];
    expect(sessionArgs.customer).toBe("cus_reuse_me");
  });

  it("creates new Stripe customer when none exists", async () => {
    setupExistingShop({
      stripe_customer_id: null,
      plan_status: null,
      plan_tier: null,
      shop_name: null,
      slug: null,
    });

    await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "pro",
        billing: "monthly",
      }),
    );

    expect(mockCustomerCreate).toHaveBeenCalledWith({
      email: "",
      metadata: { user_id: mockUser.id },
    });
  });

  it("embeds plan_tier and billing_interval in session metadata", async () => {
    setupExistingShop(null);

    await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "business",
        billing: "yearly",
      }),
    );

    const sessionArgs = mockSessionCreate.mock.calls[0][0];
    expect(sessionArgs.metadata.plan_tier).toBe("business");
    expect(sessionArgs.metadata.billing_interval).toBe("yearly");
    expect(sessionArgs.subscription_data.metadata.plan_tier).toBe("business");
    expect(sessionArgs.subscription_data.metadata.billing_interval).toBe("yearly");
  });

  it("rejects invalid tier", async () => {
    setupExistingShop(null);
    const res = await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "enterprise",
        billing: "monthly",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid tier");
  });

  it("rejects starter tier (not subscribable)", async () => {
    setupExistingShop(null);
    const res = await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "starter",
        billing: "monthly",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid billing cycle", async () => {
    setupExistingShop(null);
    const res = await POST(
      makeRequest({
        origin: "http://localhost:3000",
        tier: "pro",
        billing: "quarterly",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid billing");
  });
});
