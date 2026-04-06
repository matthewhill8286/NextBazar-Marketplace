/**
 * Tests for POST /api/dealer/verify-session — Checkout Session verification.
 *
 * This route handles the race condition where the user's redirect from
 * Stripe Checkout arrives before the webhook provisions the shop.
 * Verifies:
 *   - Missing sessionId → 400
 *   - Unauthenticated → 401
 *   - Non-dealer session → 400
 *   - Session belongs to another user → 403
 *   - Unpaid session → 402
 *   - Already active shop (webhook beat us) → returns "already_active"
 *   - Full provisioning: upserts shop, flips profile, returns plan tier
 *   - Correct metadata extraction (plan_tier, billing_interval)
 *   - Handles string vs object customer/subscription IDs
 *   - DB upsert failure → 500
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockRequireAuth, mockStripeRetrieve, mockAdminFrom } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockStripeRetrieve: vi.fn(),
  mockAdminFrom: vi.fn(),
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: mockRequireAuth,
  getUserId: vi.fn(async () => {
    const result = await mockRequireAuth();
    return result.userId ?? null;
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: { retrieve: mockStripeRetrieve },
    },
  },
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/dealer/verify-session/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { id: "user-verify-1", email: "verify@test.com" };

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/dealer/verify-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeStripeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_123",
    payment_status: "paid",
    customer: "cus_abc",
    subscription: "sub_abc",
    metadata: {
      type: "dealer_subscription",
      user_id: mockUser.id,
      plan_tier: "pro",
      billing_interval: "monthly",
    },
    ...overrides,
  };
}

function setupAdminMock(
  existingShop: Record<string, unknown> | null,
  upsertError: unknown = null,
) {
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === "dealer_shops") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingShop }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: upsertError }),
      };
    }
    if (table === "profiles") {
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return {};
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ userId: mockUser.id });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/dealer/verify-session", () => {
  // -- Input validation --

  it("returns 400 when sessionId is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing sessionId");
  });

  // -- Auth --

  it("returns 401 for unauthenticated users", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      error: "Unauthorized",
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(401);
  });

  // -- Session validation --

  it("returns 400 for non-dealer sessions", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({
        metadata: { type: "listing_promotion", user_id: mockUser.id },
      }),
    );
    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Not a dealer session");
  });

  it("returns 403 when session belongs to a different user", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({
        metadata: {
          type: "dealer_subscription",
          user_id: "someone-else",
          plan_tier: "pro",
        },
      }),
    );
    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("does not belong to you");
  });

  it("returns 402 when payment is not completed", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({ payment_status: "unpaid" }),
    );
    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toContain("Payment not completed");
  });

  // -- Race condition: webhook already provisioned --

  it("returns 'already_active' when webhook already provisioned the shop", async () => {
    mockStripeRetrieve.mockResolvedValue(makeStripeSession());
    setupAdminMock({ id: "shop-1", plan_status: "active" });

    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("already_active");
  });

  // -- Full provisioning --

  it("provisions a new shop when webhook hasn't fired yet", async () => {
    mockStripeRetrieve.mockResolvedValue(makeStripeSession());
    setupAdminMock(null); // No existing shop

    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("activated");
    expect(body.plan_tier).toBe("pro");
  });

  it("provisions when existing shop is not yet active (e.g. closed)", async () => {
    mockStripeRetrieve.mockResolvedValue(makeStripeSession());
    setupAdminMock({ id: "shop-1", plan_status: "closed" });

    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("activated");
  });

  // -- Metadata extraction --

  it("uses plan_tier and billing_interval from session metadata", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({
        metadata: {
          type: "dealer_subscription",
          user_id: mockUser.id,
          plan_tier: "business",
          billing_interval: "yearly",
        },
      }),
    );

    let upsertData: unknown = null;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: vi.fn((data: unknown) => {
            upsertData = data;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.plan_tier).toBe("business");

    expect(upsertData).toMatchObject({
      user_id: mockUser.id,
      plan_tier: "business",
      billing_interval: "yearly",
      plan_status: "active",
      stripe_customer_id: "cus_abc",
      stripe_subscription_id: "sub_abc",
    });
  });

  it("defaults to 'pro' tier and 'monthly' when metadata is missing", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({
        metadata: {
          type: "dealer_subscription",
          user_id: mockUser.id,
          // No plan_tier or billing_interval
        },
      }),
    );

    let upsertData: unknown = null;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: vi.fn((data: unknown) => {
            upsertData = data;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(upsertData).toMatchObject({
      plan_tier: "pro",
      billing_interval: "monthly",
    });
  });

  // -- Customer/subscription ID extraction --

  it("handles customer as an object (expanded)", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({
        customer: { id: "cus_obj_123", name: "Test" },
        subscription: { id: "sub_obj_456" },
      }),
    );

    let upsertData: unknown = null;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: vi.fn((data: unknown) => {
            upsertData = data;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(upsertData).toMatchObject({
      stripe_customer_id: "cus_obj_123",
      stripe_subscription_id: "sub_obj_456",
    });
  });

  it("handles null customer/subscription gracefully", async () => {
    mockStripeRetrieve.mockResolvedValue(
      makeStripeSession({ customer: null, subscription: null }),
    );
    setupAdminMock(null);

    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("activated");
  });

  // -- Error handling --

  it("returns 500 when shop upsert fails", async () => {
    mockStripeRetrieve.mockResolvedValue(makeStripeSession());
    setupAdminMock(null, { message: "DB constraint error" });

    const res = await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Failed to provision");
  });

  it("returns 500 with error message when Stripe retrieve throws", async () => {
    mockStripeRetrieve.mockRejectedValue(
      new Error("No such checkout session: cs_invalid"),
    );

    const res = await POST(makeRequest({ sessionId: "cs_invalid" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("No such checkout session");
  });

  // -- Passes expand option to Stripe --

  it("retrieves session with subscription expansion", async () => {
    mockStripeRetrieve.mockResolvedValue(makeStripeSession());
    setupAdminMock({ id: "shop-1", plan_status: "active" });

    await POST(makeRequest({ sessionId: "cs_test_123" }));
    expect(mockStripeRetrieve).toHaveBeenCalledWith("cs_test_123", {
      expand: ["subscription"],
    });
  });
});
