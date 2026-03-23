import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

// ---------------------------------------------------------------------------
// Mocks — use vi.hoisted so variables exist when vi.mock factories run
// ---------------------------------------------------------------------------

const { mockUpdate, mockEq, mockConstructEvent } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  mockConstructEvent: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  },
  PROMOTION_PRICES: {
    featured: { priceId: "price_featured_test", duration: 7 },
    urgent: { priceId: "price_urgent_test", duration: 3 },
  },
}));

// Supabase admin client mock
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: mockUpdate,
      eq: mockEq,
    })),
  })),
}));

// ---------------------------------------------------------------------------

function makeWebhookRequest(event: object, sig = "test-sig"): NextRequest {
  const body = JSON.stringify(event);
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body,
  });
}

const featuredSessionEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: {
        listing_id: "listing-1",
        promotion_type: "featured",
        duration_days: "7",
      },
    },
  },
};

const urgentSessionEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: {
        listing_id: "listing-2",
        promotion_type: "urgent",
        duration_days: "3",
      },
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // By default, no webhook secret → constructEvent is NOT called (raw JSON parse)
  delete process.env.STRIPE_WEBHOOK_SECRET;
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ error: null });
});

describe("POST /api/webhooks/stripe", () => {
  it("returns { received: true } for a checkout.session.completed event", async () => {
    const res = await POST(makeWebhookRequest(featuredSessionEvent));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("updates listing with is_promoted and promoted_until for 'featured'", async () => {
    await POST(makeWebhookRequest(featuredSessionEvent));

    expect(mockUpdate).toHaveBeenCalledOnce();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_promoted).toBe(true);
    expect(updateArg.promoted_until).toBeDefined();
    // promoted_until should be a future ISO date string
    expect(new Date(updateArg.promoted_until).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("calls .eq('id', listingId) for featured promotion", async () => {
    await POST(makeWebhookRequest(featuredSessionEvent));
    expect(mockEq).toHaveBeenCalledWith("id", "listing-1");
  });

  it("updates listing with is_urgent for 'urgent' promotion", async () => {
    await POST(makeWebhookRequest(urgentSessionEvent));

    expect(mockUpdate).toHaveBeenCalledOnce();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_urgent).toBe(true);
    // urgent doesn't set a promoted_until date
    expect(updateArg.promoted_until).toBeUndefined();
  });

  it("calls .eq('id', listingId) for urgent promotion", async () => {
    await POST(makeWebhookRequest(urgentSessionEvent));
    expect(mockEq).toHaveBeenCalledWith("id", "listing-2");
  });

  it("returns { received: true } for an unknown event type without modifying the DB", async () => {
    const unknownEvent = {
      type: "payment_intent.created",
      data: { object: {} },
    };
    const res = await POST(makeWebhookRequest(unknownEvent));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns { received: true } when session metadata is missing listing_id", async () => {
    const noMetaEvent = {
      type: "checkout.session.completed",
      data: { object: { metadata: {} } },
    };
    const res = await POST(makeWebhookRequest(noMetaEvent));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("verifies Stripe signature when STRIPE_WEBHOOK_SECRET is set", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockConstructEvent.mockReturnValue(featuredSessionEvent);

    await POST(makeWebhookRequest(featuredSessionEvent, "valid-sig"));

    expect(mockConstructEvent).toHaveBeenCalledOnce();
    const [, sig, secret] = mockConstructEvent.mock.calls[0];
    expect(sig).toBe("valid-sig");
    expect(secret).toBe("whsec_test");
  });

  it("returns 400 when signature verification fails", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const res = await POST(makeWebhookRequest(featuredSessionEvent, "bad-sig"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });
});
