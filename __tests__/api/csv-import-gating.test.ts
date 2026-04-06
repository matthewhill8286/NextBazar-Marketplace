/**
 * Tests for POST /api/dealer/import-csv — plan tier gating.
 * CSV import is a Business-only feature. This suite verifies that:
 *   - Unauthenticated users are rejected (401)
 *   - Users without a shop are rejected (403)
 *   - Starter and Pro tier users are rejected (403)
 *   - Business tier users are allowed through
 *   - Missing/invalid rows are handled correctly
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dealer/import-csv/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockRequireAuth, mockFrom, mockSelect, mockEq, mockSingle } = vi.hoisted(
  () => ({
    mockRequireAuth: vi.fn(),
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
    mockEq: vi.fn(),
    mockSingle: vi.fn(),
  }),
);

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
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://cdn.example.com/img.jpg" },
        })),
      })),
    },
  })),
}));

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/dealer/import-csv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockUser = { id: "user-csv-test", email: "csv@test.com" };

function setupShopMock(shopData: Record<string, unknown> | null) {
  // The route calls: supabase.from("dealer_shops").select(...).eq(...).single()
  // then later: supabase.from("categories").select(...), etc.
  let callCount = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === "dealer_shops") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: shopData }),
          }),
        }),
      };
    }
    // For categories, subcategories, locations
    return {
      select: vi.fn().mockResolvedValue({ data: [] }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "listing-1", slug: "test-listing" },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ userId: mockUser.id });
});

// ---------------------------------------------------------------------------

describe("POST /api/dealer/import-csv — plan tier gating", () => {
  it("returns 401 for unauthenticated users", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      error: "Unauthorized",
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });
    const res = await POST(makeRequest({ rows: [{ title: "Test" }] }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user has no shop", async () => {
    setupShopMock(null);
    const res = await POST(makeRequest({ rows: [{ title: "Test" }] }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Business plan");
  });

  it("returns 403 for starter tier", async () => {
    setupShopMock({ plan_tier: "starter", plan_status: "active" });
    const res = await POST(makeRequest({ rows: [{ title: "Test" }] }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Business plan");
  });

  it("returns 403 for pro tier", async () => {
    setupShopMock({ plan_tier: "pro", plan_status: "active" });
    const res = await POST(makeRequest({ rows: [{ title: "Test" }] }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Business plan");
  });

  it("returns 403 for business tier with inactive plan", async () => {
    setupShopMock({ plan_tier: "business", plan_status: "cancelled" });
    const res = await POST(makeRequest({ rows: [{ title: "Test" }] }));
    expect(res.status).toBe(403);
  });

  it("allows business tier with active plan", async () => {
    setupShopMock({ plan_tier: "business", plan_status: "active" });
    const res = await POST(
      makeRequest({
        rows: [{ title: "Valid Listing", category_slug: "electronics" }],
      }),
    );
    // Should NOT be 403 — it may be 200 or have row-level errors, but gate passes
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  it("returns 400 for empty rows array", async () => {
    setupShopMock({ plan_tier: "business", plan_status: "active" });
    const res = await POST(makeRequest({ rows: [] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("No rows");
  });

  it("returns 400 for more than 200 rows", async () => {
    setupShopMock({ plan_tier: "business", plan_status: "active" });
    const rows = Array.from({ length: 201 }, (_, i) => ({
      title: `Item ${i}`,
    }));
    const res = await POST(makeRequest({ rows }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("200");
  });
});
