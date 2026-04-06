/**
 * Tests for shop close/reopen lifecycle.
 *
 * POST /api/dealer/close-shop:
 *   - Unauthenticated → 401
 *   - No shop → 404
 *   - Already closed → 409
 *   - Cancels Stripe subscription, sets plan_status = "closed",
 *     deactivates listings, removes is_pro_seller flag
 *   - Gracefully handles already-cancelled Stripe subscriptions
 *
 * POST /api/dealer/reopen-shop:
 *   - Unauthenticated → 401
 *   - No shop → 404
 *   - Already active → 409
 *   - Non-closed status → 400
 *   - Stripe-subscribed shops must re-subscribe → 402
 *   - Promo-code shops get reactivated for 1 month
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockRequireAuth,
  mockAdminFrom,
  mockStripeCancel,
  mockAuthFrom,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockAdminFrom: vi.fn(),
  mockAuthFrom: vi.fn(),
  mockStripeCancel: vi.fn(),
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
    from: mockAuthFrom,
  })),
}));

// Both close-shop and reopen-shop create an admin client at module scope
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    subscriptions: { cancel: mockStripeCancel },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { id: "user-lifecycle-1", email: "shop@test.com" };

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/dealer/close-shop", {
    method: "POST",
  });
}

/** Configures the admin client's `.from("dealer_shops").select().eq().single()` */
function setupAdminShopMock(shopData: Record<string, unknown> | null) {
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  mockAdminFrom.mockImplementation((table: string) => {
    if (table === "dealer_shops") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: shopData }),
          }),
        }),
        update: mockUpdate,
      };
    }
    // profiles + listings
    return {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };
  });

  return { mockUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ userId: mockUser.id });
});

// ═══════════════════════════════════════════════════════════════════════════
// Close shop
// ═══════════════════════════════════════════════════════════════════════════

describe("POST /api/dealer/close-shop", () => {
  // Re-import for each describe to isolate module-scoped admin client
  let closeShopPOST: typeof import("@/app/api/dealer/close-shop/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/dealer/close-shop/route");
    closeShopPOST = mod.POST;
  });

  it("returns 401 for unauthenticated users", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      error: "Unauthorized",
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const res = await closeShopPOST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no shop", async () => {
    setupAdminShopMock(null);
    const res = await closeShopPOST(makeRequest());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No shop");
  });

  it("returns 409 when shop is already closed", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "closed",
      stripe_subscription_id: null,
      stripe_customer_id: null,
    });
    const res = await closeShopPOST(makeRequest());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already closed");
  });

  it("cancels Stripe subscription when one exists", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "active",
      stripe_subscription_id: "sub_abc123",
      stripe_customer_id: "cus_abc123",
    });
    mockStripeCancel.mockResolvedValue({});

    await closeShopPOST(makeRequest());
    expect(mockStripeCancel).toHaveBeenCalledWith("sub_abc123");
  });

  it("succeeds even if Stripe subscription is already cancelled", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "active",
      stripe_subscription_id: "sub_gone",
      stripe_customer_id: "cus_abc123",
    });
    mockStripeCancel.mockRejectedValue(
      new Error("No such subscription: sub_gone"),
    );

    const res = await closeShopPOST(makeRequest());
    // Should not fail — warning is logged but shop is still closed
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns success with message on valid closure", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "active",
      stripe_subscription_id: null,
      stripe_customer_id: null,
    });

    const res = await closeShopPOST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("closed");
  });

  it("deactivates listings and removes pro seller flag", async () => {
    const tables: string[] = [];
    mockAdminFrom.mockImplementation((table: string) => {
      tables.push(table);
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "shop-1",
                  plan_status: "active",
                  stripe_subscription_id: null,
                  stripe_customer_id: null,
                },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    });

    await closeShopPOST(makeRequest());

    // Should have touched dealer_shops (select + update), profiles, listings
    expect(tables).toContain("profiles");
    expect(tables).toContain("listings");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Reopen shop
// ═══════════════════════════════════════════════════════════════════════════

describe("POST /api/dealer/reopen-shop", () => {
  let reopenShopPOST: typeof import("@/app/api/dealer/reopen-shop/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/dealer/reopen-shop/route");
    reopenShopPOST = mod.POST;
  });

  it("returns 401 for unauthenticated users", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      error: "Unauthorized",
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const res = await reopenShopPOST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 404 when user has no shop", async () => {
    setupAdminShopMock(null);
    const res = await reopenShopPOST(makeRequest());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No shop");
  });

  it("returns 409 when shop is already active", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "active",
      stripe_subscription_id: null,
    });
    const res = await reopenShopPOST(makeRequest());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already active");
  });

  it("returns 400 for non-closed statuses (e.g. past_due)", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "past_due",
      stripe_subscription_id: "sub_abc",
    });
    const res = await reopenShopPOST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("cannot be reopened");
  });

  it("returns 402 when Stripe subscription existed (must re-subscribe)", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "closed",
      stripe_subscription_id: "sub_old_123",
    });
    const res = await reopenShopPOST(makeRequest());
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toContain("re-subscribe");
    expect(body.requiresSubscription).toBe(true);
  });

  it("reactivates promo-code shops for 1 month", async () => {
    setupAdminShopMock({
      id: "shop-1",
      plan_status: "closed",
      stripe_subscription_id: null,
    });

    const res = await reopenShopPOST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("back open");
    expect(body.expires_at).toBeDefined();

    // Verify expiry is ~1 month from now
    const expiry = new Date(body.expires_at);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(27);
    expect(diffDays).toBeLessThan(32);
  });

  it("restores is_pro_seller flag on reopen", async () => {
    const tables: string[] = [];
    mockAdminFrom.mockImplementation((table: string) => {
      tables.push(table);
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "shop-1",
                  plan_status: "closed",
                  stripe_subscription_id: null,
                },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    });

    await reopenShopPOST(makeRequest());
    expect(tables).toContain("profiles");
  });
});
