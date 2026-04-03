/**
 * Tests for POST /api/dealer/subscribe — multi-tier seller plan checkout.
 * Validates tier + billing parameter handling, Stripe session creation,
 * and metadata embedding for webhook processing.
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
  mockProductCreate,
  mockPriceCreate,
  mockGetSellerPlan,
  mockGetUser,
  mockSelect,
  mockEq,
  mockSingle,
} = vi.hoisted(() => ({
  mockSessionCreate: vi.fn(),
  mockCustomerCreate: vi.fn(),
  mockProductCreate: vi.fn(),
  mockPriceCreate: vi.fn(),
  mockGetSellerPlan: vi.fn(),
  mockGetUser: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockSingle: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: mockSessionCreate } },
    customers: { create: mockCustomerCreate },
    products: { create: mockProductCreate },
    prices: { create: mockPriceCreate },
  },
  getSellerPlan: mockGetSellerPlan,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

// Also need to mock pricing-config since subscribe/route imports SellerTier
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

const mockUser = {
  id: "user-123",
  email: "test@nextbazar.com",
};

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated user
  mockGetUser.mockResolvedValue({ data: { user: mockUser } });

  // Default: no existing shop
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({ data: null });

  // Default: Stripe customer creation
  mockCustomerCreate.mockResolvedValue({ id: "cus_new_123" });

  // Default: plan resolution
  mockGetSellerPlan.mockResolvedValue({
    priceId: "price_pro_monthly",
    dbKey: "dealer_pro",
    name: "Pro",
    description: "Professional seller",
    amount: 2900,
    interval: "month",
    tier: "pro",
    billingCycle: "monthly",
  });

  // Default: successful session
  mockSessionCreate.mockResolvedValue({
    url: "https://checkout.stripe.com/test",
  });

  // Dynamic price creation fallback
  mockProductCreate.mockResolvedValue({ id: "prod_dynamic" });
  mockPriceCreate.mockResolvedValue({ id: "price_dynamic" });
});

describe("POST /api/dealer/subscribe", () => {
  // ─── Validation ──────────────────────────────────────────────────────

  it("returns 400 when origin is missing", async () => {
    const res = await POST(makeRequest({ tier: "pro", billing: "monthly" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing origin");
  });

  it("returns 400 for invalid tier", async () => {
    const res = await POST(
      makeRequest({ origin: "http://localhost", tier: "enterprise", billing: "monthly" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid tier");
  });

  it("returns 400 for invalid billing cycle", async () => {
    const res = await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "weekly" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid billing");
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );
    expect(res.status).toBe(401);
  });

  // ─── Defaults ────────────────────────────────────────────────────────

  it("defaults tier to 'pro' and billing to 'monthly' when omitted", async () => {
    await POST(makeRequest({ origin: "http://localhost" }));

    expect(mockGetSellerPlan).toHaveBeenCalledWith("pro", "monthly");
  });

  // ─── Plan resolution ─────────────────────────────────────────────────

  it("calls getSellerPlan with the requested tier and billing", async () => {
    await POST(
      makeRequest({ origin: "http://localhost", tier: "business", billing: "yearly" }),
    );

    expect(mockGetSellerPlan).toHaveBeenCalledWith("business", "yearly");
  });

  // ─── Stripe customer handling ────────────────────────────────────────

  it("creates a new Stripe customer when shop does not exist", async () => {
    await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );

    expect(mockCustomerCreate).toHaveBeenCalledWith({
      email: "test@nextbazar.com",
      metadata: { user_id: "user-123" },
    });
  });

  it("reuses existing Stripe customer when shop already has one", async () => {
    mockSingle.mockResolvedValue({
      data: {
        stripe_customer_id: "cus_existing_456",
        plan_status: "cancelled",
        plan_tier: "starter",
      },
    });

    await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );

    expect(mockCustomerCreate).not.toHaveBeenCalled();
    const sessionCall = mockSessionCreate.mock.calls[0][0];
    expect(sessionCall.customer).toBe("cus_existing_456");
  });

  // ─── Stripe session creation ─────────────────────────────────────────

  it("creates Stripe checkout session in subscription mode", async () => {
    await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );

    expect(mockSessionCreate).toHaveBeenCalledOnce();
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.mode).toBe("subscription");
    expect(call.line_items[0].price).toBe("price_pro_monthly");
    expect(call.line_items[0].quantity).toBe(1);
  });

  it("embeds plan_tier and billing_interval in session metadata", async () => {
    await POST(
      makeRequest({ origin: "http://localhost", tier: "business", billing: "yearly" }),
    );

    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.metadata.plan_tier).toBe("business");
    expect(call.metadata.billing_interval).toBe("yearly");
    expect(call.metadata.type).toBe("dealer_subscription");
    expect(call.metadata.user_id).toBe("user-123");
  });

  it("embeds plan_tier in subscription_data metadata for webhook access", async () => {
    await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "yearly" }),
    );

    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.subscription_data.metadata.plan_tier).toBe("pro");
    expect(call.subscription_data.metadata.billing_interval).toBe("yearly");
  });

  it("sets success_url to shop-onboarding", async () => {
    await POST(
      makeRequest({ origin: "https://nextbazar.com", tier: "pro", billing: "monthly" }),
    );

    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.success_url).toContain("https://nextbazar.com/shop-onboarding");
  });

  it("sets cancel_url to pricing page", async () => {
    await POST(
      makeRequest({ origin: "https://nextbazar.com", tier: "pro", billing: "monthly" }),
    );

    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.cancel_url).toBe("https://nextbazar.com/pricing");
  });

  it("returns 200 with Stripe checkout URL", async () => {
    const res = await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/test");
  });

  // ─── Dynamic price creation ──────────────────────────────────────────

  it("creates product + price on-the-fly when priceId is empty", async () => {
    mockGetSellerPlan.mockResolvedValue({
      priceId: "",
      dbKey: "dealer_pro",
      name: "Pro",
      description: "Professional seller",
      amount: 2900,
      interval: "month",
      tier: "pro",
      billingCycle: "monthly",
    });

    await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );

    expect(mockProductCreate).toHaveBeenCalledOnce();
    expect(mockPriceCreate).toHaveBeenCalledOnce();

    const priceCall = mockPriceCreate.mock.calls[0][0];
    expect(priceCall.unit_amount).toBe(2900);
    expect(priceCall.currency).toBe("eur");
    expect(priceCall.recurring.interval).toBe("month");

    // Should use the dynamically created price
    const sessionCall = mockSessionCreate.mock.calls[0][0];
    expect(sessionCall.line_items[0].price).toBe("price_dynamic");
  });

  // ─── Error handling ──────────────────────────────────────────────────

  it("returns 500 when Stripe throws", async () => {
    mockSessionCreate.mockRejectedValueOnce(new Error("Stripe API error"));

    const res = await POST(
      makeRequest({ origin: "http://localhost", tier: "pro", billing: "monthly" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Stripe API error");
  });
});
