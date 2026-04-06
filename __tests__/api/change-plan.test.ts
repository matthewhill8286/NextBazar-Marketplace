/**
 * Tests for POST /api/dealer/change-plan — upgrade/downgrade Stripe subscription.
 * Validates tier validation, subscription update, proration, and DB sync.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dealer/change-plan/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockSubscriptionRetrieve,
  mockSubscriptionUpdate,
  mockProductCreate,
  mockPriceCreate,
  mockGetSellerPlan,
  mockRequireAuth,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockUpdate,
  mockUpdateEq,
} = vi.hoisted(() => ({
  mockSubscriptionRetrieve: vi.fn(),
  mockSubscriptionUpdate: vi.fn(),
  mockProductCreate: vi.fn(),
  mockPriceCreate: vi.fn(),
  mockGetSellerPlan: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpdateEq: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: {
      retrieve: mockSubscriptionRetrieve,
      update: mockSubscriptionUpdate,
    },
    products: { create: mockProductCreate },
    prices: { create: mockPriceCreate },
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
    from: mockFrom,
  })),
}));

vi.mock("@/lib/pricing-config", async () => {
  const actual = await vi.importActual("@/lib/pricing-config");
  return actual;
});

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/dealer/change-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockUser = { id: "user-123", email: "test@nextbazar.com" };

const activeProShop = {
  stripe_subscription_id: "sub_abc123",
  stripe_customer_id: "cus_abc123",
  plan_tier: "pro",
  plan_status: "active",
  billing_interval: "monthly",
};

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated user
  mockRequireAuth.mockResolvedValue({ userId: mockUser.id });

  // Default: active Pro shop
  mockSingle.mockResolvedValue({ data: activeProShop });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });

  mockFrom.mockImplementation((table: string) => {
    if (table === "dealer_shops") {
      return {
        select: mockSelect,
        update: mockUpdate,
      };
    }
    return { select: vi.fn(), update: vi.fn() };
  });

  // Default: plan resolution
  mockGetSellerPlan.mockResolvedValue({
    priceId: "price_business_monthly",
    dbKey: "dealer_business",
    name: "Business",
    description: "Business seller",
    amount: 8900,
    interval: "month",
    tier: "business",
    billingCycle: "monthly",
  });

  // Default: subscription retrieve
  mockSubscriptionRetrieve.mockResolvedValue({
    items: { data: [{ id: "si_item_1" }] },
  });

  // Default: subscription update
  mockSubscriptionUpdate.mockResolvedValue({
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
  });

  // Dynamic price creation
  mockProductCreate.mockResolvedValue({ id: "prod_dynamic" });
  mockPriceCreate.mockResolvedValue({ id: "price_dynamic" });
});

describe("POST /api/dealer/change-plan", () => {
  // ─── Validation ──────────────────────────────────────────────────────

  it("returns 400 for invalid tier", async () => {
    const res = await POST(makeRequest({ newTier: "enterprise" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid tier");
  });

  it("returns 400 when newTier is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      error: "Unauthorized",
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when shop is not found", async () => {
    mockSingle.mockResolvedValue({ data: null });
    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No active subscription");
  });

  it("returns 404 when shop is not active", async () => {
    mockSingle.mockResolvedValue({
      data: { ...activeProShop, plan_status: "cancelled" },
    });
    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 when no Stripe subscription exists", async () => {
    mockSingle.mockResolvedValue({
      data: { ...activeProShop, stripe_subscription_id: null },
    });
    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("No Stripe subscription");
  });

  it("returns 400 when changing to the same tier and billing", async () => {
    const res = await POST(makeRequest({ newTier: "pro", billing: "monthly" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("already on this plan");
  });

  // ─── Successful upgrade (pro → business) ────────────────────────────

  it("upgrades from pro to business successfully", async () => {
    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.newTier).toBe("business");
  });

  it("retrieves the existing subscription", async () => {
    await POST(makeRequest({ newTier: "business" }));
    expect(mockSubscriptionRetrieve).toHaveBeenCalledWith("sub_abc123");
  });

  it("updates the subscription with the new price", async () => {
    await POST(makeRequest({ newTier: "business" }));

    expect(mockSubscriptionUpdate).toHaveBeenCalledOnce();
    const [subId, updateArgs] = mockSubscriptionUpdate.mock.calls[0];
    expect(subId).toBe("sub_abc123");
    expect(updateArgs.items[0].id).toBe("si_item_1");
    expect(updateArgs.items[0].price).toBe("price_business_monthly");
  });

  it("embeds plan_tier in subscription metadata for webhook", async () => {
    await POST(makeRequest({ newTier: "business" }));

    const updateArgs = mockSubscriptionUpdate.mock.calls[0][1];
    expect(updateArgs.metadata.plan_tier).toBe("business");
    expect(updateArgs.metadata.type).toBe("dealer_subscription");
    expect(updateArgs.metadata.user_id).toBe("user-123");
  });

  it("updates the local DB with the new tier", async () => {
    await POST(makeRequest({ newTier: "business" }));

    expect(mockUpdate).toHaveBeenCalled();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_tier).toBe("business");
    expect(updateArg.plan_started_at).toBeDefined();
  });

  it("returns upgrade message for pro → business", async () => {
    const res = await POST(makeRequest({ newTier: "business" }));
    const body = await res.json();
    expect(body.message).toContain("Upgraded");
    expect(body.message).toContain("Business");
  });

  // ─── Successful downgrade (business → pro) ──────────────────────────

  it("downgrades from business to pro successfully", async () => {
    mockSingle.mockResolvedValue({
      data: { ...activeProShop, plan_tier: "business" },
    });
    mockGetSellerPlan.mockResolvedValue({
      priceId: "price_pro_monthly",
      dbKey: "dealer_pro",
      name: "Pro",
      description: "Pro seller",
      amount: 2900,
      interval: "month",
      tier: "pro",
      billingCycle: "monthly",
    });

    const res = await POST(makeRequest({ newTier: "pro" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.newTier).toBe("pro");
  });

  // ─── Billing interval change ────────────────────────────────────────

  it("uses existing billing interval when not specified", async () => {
    await POST(makeRequest({ newTier: "business" }));

    expect(mockGetSellerPlan).toHaveBeenCalledWith("business", "monthly");
  });

  it("accepts explicit billing interval override", async () => {
    await POST(makeRequest({ newTier: "business", billing: "yearly" }));

    expect(mockGetSellerPlan).toHaveBeenCalledWith("business", "yearly");
  });

  // ─── Dynamic price creation fallback ────────────────────────────────

  it("creates product + price when priceId is empty", async () => {
    mockGetSellerPlan.mockResolvedValue({
      priceId: "",
      dbKey: "dealer_business",
      name: "Business",
      description: "Business seller",
      amount: 8900,
      interval: "month",
      tier: "business",
      billingCycle: "monthly",
    });

    await POST(makeRequest({ newTier: "business" }));

    expect(mockProductCreate).toHaveBeenCalledOnce();
    expect(mockPriceCreate).toHaveBeenCalledOnce();

    const updateArgs = mockSubscriptionUpdate.mock.calls[0][1];
    expect(updateArgs.items[0].price).toBe("price_dynamic");
  });

  // ─── Error handling ─────────────────────────────────────────────────

  it("returns 500 when Stripe throws", async () => {
    mockSubscriptionUpdate.mockRejectedValueOnce(
      new Error("Stripe rate limit"),
    );

    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Stripe rate limit");
  });

  it("returns 500 when subscription item is not found", async () => {
    mockSubscriptionRetrieve.mockResolvedValue({
      items: { data: [] },
    });

    const res = await POST(makeRequest({ newTier: "business" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("subscription item");
  });
});
