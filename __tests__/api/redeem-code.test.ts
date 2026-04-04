/**
 * Tests for POST /api/dealer/redeem-code — promo code redemption.
 *
 * This route validates a promo code and provisions a 1-month free
 * Pro Seller subscription. Verifies:
 *   - Missing/invalid code → 400
 *   - Wrong promo code → 404
 *   - Unauthenticated → 401
 *   - Already active subscription → 409
 *   - Valid code (case-insensitive) → creates shop + flips profile flag
 *   - Expiry date is ~1 month out
 *   - Upserts shop with correct defaults (slug, shop_name)
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockGetUser, mockAdminFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockAdminFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/dealer/redeem-code/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { id: "user-promo-1", email: "promo@test.com" };

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/dealer/redeem-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupAdminMock(
  existingShop: Record<string, unknown> | null,
  upsertError: unknown = null,
  profileError: unknown = null,
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
          eq: vi.fn().mockResolvedValue({ error: profileError }),
        }),
      };
    }
    return {};
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: mockUser } });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/dealer/redeem-code", () => {
  // -- Input validation --

  it("returns 400 when code is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("required");
  });

  it("returns 400 when code is not a string", async () => {
    const res = await POST(makeRequest({ code: 12345 }));
    expect(res.status).toBe(400);
  });

  // -- Invalid code --

  it("returns 404 for an incorrect promo code", async () => {
    const res = await POST(makeRequest({ code: "WRONGCODE" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("Invalid promo code");
  });

  // -- Auth --

  it("returns 401 for unauthenticated users (valid code)", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeRequest({ code: "NEXTBAZAR" }));
    expect(res.status).toBe(401);
  });

  // -- Already active --

  it("returns 409 when user already has an active shop", async () => {
    setupAdminMock({ plan_status: "active" });
    const res = await POST(makeRequest({ code: "NEXTBAZAR" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already have an active");
  });

  // -- Case insensitivity --

  it("accepts the promo code in lowercase", async () => {
    setupAdminMock(null);
    const res = await POST(makeRequest({ code: "nextbazar" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("accepts the promo code with mixed case and whitespace", async () => {
    setupAdminMock(null);
    const res = await POST(makeRequest({ code: "  NextBazar  " }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // -- Happy path --

  it("activates Pro Seller for 1 month with correct response", async () => {
    setupAdminMock(null);
    const res = await POST(makeRequest({ code: "NEXTBAZAR" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("1 month");
    expect(body.expires_at).toBeDefined();

    // Expiry should be ~1 month from now
    const expiry = new Date(body.expires_at);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(27);
    expect(diffDays).toBeLessThan(32);
  });

  it("upserts shop with correct defaults (slug = first 8 chars of user ID)", async () => {
    let upsertArgs: unknown = null;
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "dealer_shops") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
          upsert: vi.fn((data: unknown) => {
            upsertArgs = data;
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

    await POST(makeRequest({ code: "NEXTBAZAR" }));

    expect(upsertArgs).toMatchObject({
      user_id: mockUser.id,
      shop_name: "My Shop",
      slug: mockUser.id.slice(0, 8),
      plan_status: "active",
    });
  });

  // -- Allows reopening closed shops --

  it("allows activation when existing shop is closed", async () => {
    setupAdminMock({ plan_status: "closed" });
    const res = await POST(makeRequest({ code: "NEXTBAZAR" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // -- Error handling --

  it("returns 500 when shop upsert fails", async () => {
    setupAdminMock(null, { message: "DB write failed" });
    const res = await POST(makeRequest({ code: "NEXTBAZAR" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Failed to activate");
  });

  it("still succeeds if profile update fails (non-critical)", async () => {
    // Profile update error is logged but doesn't fail the request
    setupAdminMock(null, null, { message: "Profile update failed" });
    const res = await POST(makeRequest({ code: "NEXTBAZAR" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
