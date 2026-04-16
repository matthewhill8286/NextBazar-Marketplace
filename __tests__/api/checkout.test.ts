import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/checkout/route";
import { __resetRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Mock Stripe, Supabase, and auth
// ---------------------------------------------------------------------------

const {
  mockSessionCreate,
  mockRequireAuth,
  mockMaybeSingle,
  mockEq,
  mockSelect,
  mockFrom,
} = vi.hoisted(() => ({
  mockSessionCreate: vi.fn(),
  mockRequireAuth: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockSessionCreate,
      },
    },
    products: { create: vi.fn(async () => ({ id: "prod_test" })) },
    prices: {
      create: vi.fn(async () => ({ id: "price_dynamic_test" })),
    },
  },
  getPromotionPrices: vi.fn(async () => ({
    featured: {
      priceId: "price_featured_test",
      name: "Featured Listing",
      amount: 499,
      duration: 7,
    },
    urgent: {
      priceId: "price_urgent_test",
      name: "Quick Boost",
      amount: 299,
      duration: 3,
    },
  })),
}));

vi.mock("@/lib/auth/require-auth", () => ({
  requireAuth: mockRequireAuth,
  getUserId: vi.fn(async () => {
    const r = await mockRequireAuth();
    return r.userId ?? null;
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const USER_ID = "user-owner";

beforeEach(() => {
  vi.clearAllMocks();
  __resetRateLimit();
  mockRequireAuth.mockResolvedValue({ userId: USER_ID });

  // Default listing lookup: returns a listing owned by the authenticated user
  mockMaybeSingle.mockResolvedValue({
    data: { id: "listing-1", user_id: USER_ID },
    error: null,
  });
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockImplementation((table: string) => {
    if (table === "listings") {
      return { select: mockSelect };
    }
    return { select: vi.fn() };
  });

  mockSessionCreate.mockResolvedValue({
    url: "https://checkout.stripe.com/pay/test_session",
  });
});

describe("POST /api/checkout", () => {
  // ─── Auth gate ────────────────────────────────────────────────────────

  it("returns 401 when the caller is not authenticated", async () => {
    mockRequireAuth.mockResolvedValueOnce({
      error: "Unauthorized",
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });
    const res = await POST(
      makeRequest({
        listingId: "listing-1",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when the listing does not exist", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await POST(
      makeRequest({
        listingId: "ghost",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the listing belongs to a different user", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "listing-1", user_id: "someone-else" },
      error: null,
    });
    const res = await POST(
      makeRequest({
        listingId: "listing-1",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(403);
  });

  // ─── Input validation ─────────────────────────────────────────────────

  it("returns 400 when listingId is missing", async () => {
    const res = await POST(
      makeRequest({
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when promotionType is missing", async () => {
    const res = await POST(
      makeRequest({ listingId: "listing-1", origin: "https://nextbazar.com" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when origin is missing", async () => {
    const res = await POST(
      makeRequest({ listingId: "listing-1", promotionType: "featured" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("returns 400 when promotionType is invalid", async () => {
    const res = await POST(
      makeRequest({
        listingId: "listing-1",
        promotionType: "diamond",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid promotion type");
  });

  // ─── Happy path ───────────────────────────────────────────────────────

  it("returns 200 with Stripe checkout URL for 'featured' promotion", async () => {
    const res = await POST(
      makeRequest({
        listingId: "listing-1",
        listingTitle: "iPhone 14",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/pay/test_session");
  });

  it("returns 200 with Stripe checkout URL for 'urgent' promotion", async () => {
    const res = await POST(
      makeRequest({
        listingId: "listing-2",
        promotionType: "urgent",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/pay/test_session");
  });

  it("calls stripe.checkout.sessions.create with correct priceId for featured", async () => {
    await POST(
      makeRequest({
        listingId: "listing-1",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.line_items[0].price).toBe("price_featured_test");
    expect(call.line_items[0].quantity).toBe(1);
  });

  it("embeds listingId, promotionType, and initiated_by in Stripe session metadata", async () => {
    await POST(
      makeRequest({
        listingId: "listing-42",
        promotionType: "urgent",
        origin: "https://nextbazar.com",
      }),
    );
    // Override listing ownership for this test
    // (the default maybeSingle returns listing-1; here we assert metadata)
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.metadata.listing_id).toBe("listing-42");
    expect(call.metadata.promotion_type).toBe("urgent");
    expect(call.metadata.initiated_by).toBe(USER_ID);
  });

  it("builds success_url with origin and listing_id", async () => {
    await POST(
      makeRequest({
        listingId: "listing-99",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.success_url).toContain("https://nextbazar.com");
    expect(call.success_url).toContain("listing-99");
  });

  it("returns 500 when Stripe throws", async () => {
    mockSessionCreate.mockRejectedValueOnce(new Error("Stripe API error"));
    const res = await POST(
      makeRequest({
        listingId: "listing-1",
        promotionType: "featured",
        origin: "https://nextbazar.com",
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Stripe API error");
  });
});
