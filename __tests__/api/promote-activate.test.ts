import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/promote/activate/route";

// ---------------------------------------------------------------------------
// Mocks — use vi.hoisted so variables exist when vi.mock factories run
// ---------------------------------------------------------------------------

const { mockRetrieve, mockUpdate, mockEq, mockSelect, mockSingle } =
  vi.hoisted(() => ({
    mockRetrieve: vi.fn(),
    mockUpdate: vi.fn(),
    mockEq: vi.fn(),
    mockSelect: vi.fn(),
    mockSingle: vi.fn(),
  }));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: mockRetrieve,
      },
    },
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  })),
}));

// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/promote/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const paidSession = (overrides = {}) => ({
  payment_status: "paid",
  metadata: {
    listing_id: "listing-abc",
    promotion_type: "featured",
    duration_days: "7",
  },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockRetrieve.mockResolvedValue(paidSession());
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ single: mockSingle });
  mockSingle.mockResolvedValue({
    data: {
      id: "listing-abc",
      slug: "test-listing",
      title: "Test",
      is_promoted: true,
      is_urgent: false,
    },
    error: null,
  });
});

describe("POST /api/promote/activate", () => {
  it("returns 400 when session_id is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing session_id");
  });

  it("returns 402 when payment is not completed", async () => {
    mockRetrieve.mockResolvedValue({
      payment_status: "unpaid",
      metadata: {},
    });
    const res = await POST(makeRequest({ session_id: "cs_test" }));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe("Payment not completed");
    expect(body.payment_status).toBe("unpaid");
  });

  it("returns 422 when session metadata is missing listing_id", async () => {
    mockRetrieve.mockResolvedValue(paidSession({ metadata: {} }));
    const res = await POST(makeRequest({ session_id: "cs_test" }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain("metadata missing");
  });

  it("returns 422 when session metadata is missing promotion_type", async () => {
    mockRetrieve.mockResolvedValue(
      paidSession({ metadata: { listing_id: "x" } }),
    );
    const res = await POST(makeRequest({ session_id: "cs_test" }));
    expect(res.status).toBe(422);
  });

  it("sets is_promoted and promoted_until for featured promotion", async () => {
    await POST(makeRequest({ session_id: "cs_test" }));

    expect(mockUpdate).toHaveBeenCalledOnce();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe("active");
    expect(updateArg.is_promoted).toBe(true);
    expect(updateArg.promoted_until).toBeDefined();
    expect(new Date(updateArg.promoted_until).getTime()).toBeGreaterThan(
      Date.now(),
    );
    // Should not set urgent fields
    expect(updateArg.is_urgent).toBeUndefined();
    expect(updateArg.boosted_until).toBeUndefined();
  });

  it("sets is_urgent and boosted_until for urgent promotion", async () => {
    mockRetrieve.mockResolvedValue(
      paidSession({
        metadata: {
          listing_id: "listing-xyz",
          promotion_type: "urgent",
          duration_days: "3",
        },
      }),
    );

    await POST(makeRequest({ session_id: "cs_test" }));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe("active");
    expect(updateArg.is_urgent).toBe(true);
    expect(updateArg.boosted_until).toBeDefined();
    expect(new Date(updateArg.boosted_until).getTime()).toBeGreaterThan(
      Date.now(),
    );
    // Should not set featured fields
    expect(updateArg.is_promoted).toBeUndefined();
    expect(updateArg.promoted_until).toBeUndefined();
  });

  it("defaults durationDays to 7 when not provided", async () => {
    mockRetrieve.mockResolvedValue(
      paidSession({
        metadata: {
          listing_id: "listing-abc",
          promotion_type: "featured",
          // no duration_days
        },
      }),
    );

    await POST(makeRequest({ session_id: "cs_test" }));

    const updateArg = mockUpdate.mock.calls[0][0];
    const promotedUntil = new Date(updateArg.promoted_until);
    const expectedMin = new Date();
    expectedMin.setDate(expectedMin.getDate() + 6); // allow 1 day margin
    expect(promotedUntil.getTime()).toBeGreaterThan(expectedMin.getTime());
  });

  it("calls .eq with the correct listing ID", async () => {
    await POST(makeRequest({ session_id: "cs_test" }));
    expect(mockEq).toHaveBeenCalledWith("id", "listing-abc");
  });

  it("returns success response with listing data", async () => {
    const res = await POST(makeRequest({ session_id: "cs_test" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.listing.id).toBe("listing-abc");
    expect(body.promotionType).toBe("featured");
    expect(body.durationDays).toBe(7);
  });

  it("returns 500 when database update fails", async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const res = await POST(makeRequest({ session_id: "cs_test" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Database update failed");
  });

  it("returns 500 when Stripe retrieve throws", async () => {
    mockRetrieve.mockRejectedValue(new Error("Stripe API down"));

    const res = await POST(makeRequest({ session_id: "cs_test" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Stripe API down");
  });
});
