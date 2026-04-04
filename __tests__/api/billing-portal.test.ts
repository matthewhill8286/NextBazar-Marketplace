/**
 * Tests for POST /api/dealer/portal — billing portal access.
 *
 * The billing portal route creates a Stripe billing portal session so
 * sellers can manage their subscription. This suite verifies:
 *   - Missing origin is rejected (400)
 *   - Unauthenticated users are rejected (401)
 *   - Users with no shop get a helpful error (404)
 *   - Free-tier users (no stripe_customer_id) are told to subscribe first (404)
 *   - Valid requests receive a portal URL
 *   - Unconfigured billing portal returns a 503 with guidance
 *   - Generic Stripe errors return 500
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — hoisted so they're available before module evaluation
// ---------------------------------------------------------------------------

const { mockGetUser, mockFrom, mockPortalCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockPortalCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: { create: mockPortalCreate },
    },
  },
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks are set up
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/dealer/portal/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/dealer/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockUser = { id: "user-portal-1", email: "portal@test.com" };

function setupShopMock(shopData: Record<string, unknown> | null) {
  mockFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: shopData }),
      }),
    }),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: mockUser } });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/dealer/portal", () => {
  // -- Input validation --

  it("returns 400 when origin is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("origin");
  });

  // -- Auth --

  it("returns 401 for unauthenticated users", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(res.status).toBe(401);
  });

  // -- No shop --

  it("returns 404 when user has no dealer shop", async () => {
    setupShopMock(null);
    const res = await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No dealer shop");
  });

  // -- Free tier (no Stripe customer) --

  it("returns 404 for free-tier users without a Stripe customer", async () => {
    setupShopMock({
      stripe_customer_id: null,
      plan_status: "active",
      plan_tier: "starter",
    });
    const res = await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No billing account");
    expect(body.error).toContain("free tier");
  });

  // -- Happy path --

  it("returns a portal URL for a paying customer", async () => {
    setupShopMock({
      stripe_customer_id: "cus_abc123",
      plan_status: "active",
      plan_tier: "pro",
    });
    mockPortalCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session/test_portal",
    });

    const res = await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://billing.stripe.com/session/test_portal");
  });

  it("passes the correct customer ID and return_url to Stripe", async () => {
    setupShopMock({
      stripe_customer_id: "cus_xyz789",
      plan_status: "active",
      plan_tier: "business",
    });
    mockPortalCreate.mockResolvedValue({ url: "https://portal.stripe.com/s" });

    await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: "cus_xyz789",
      return_url: "https://nextbazar.com/shop-manager",
    });
  });

  // -- Stripe errors --

  it("returns 503 when billing portal is not configured", async () => {
    setupShopMock({
      stripe_customer_id: "cus_abc123",
      plan_status: "active",
      plan_tier: "pro",
    });
    mockPortalCreate.mockRejectedValue(
      new Error("No configuration was found for this portal"),
    );

    const res = await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("billing portal is not configured");
  });

  it("returns 500 for generic Stripe errors", async () => {
    setupShopMock({
      stripe_customer_id: "cus_abc123",
      plan_status: "active",
      plan_tier: "pro",
    });
    mockPortalCreate.mockRejectedValue(
      new Error("Something went wrong with Stripe"),
    );

    const res = await POST(makeRequest({ origin: "https://nextbazar.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Something went wrong");
  });
});
