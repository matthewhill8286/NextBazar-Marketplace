/**
 * Extended stripe webhook tests — covers dealer subscription logic,
 * boosted_until for urgent promotions, subscription lifecycle events,
 * and multi-tier plan_tier / billing_interval metadata handling.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUpdate, mockEq, mockUpsert, mockConstructEvent, mockFrom } =
  vi.hoisted(() => ({
    mockUpdate: vi.fn(),
    mockEq: vi.fn(),
    mockUpsert: vi.fn(),
    mockConstructEvent: vi.fn(),
    mockFrom: vi.fn(),
  }));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

// ---------------------------------------------------------------------------

function makeWebhookRequest(event: object, sig = "test-sig"): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body: JSON.stringify(event),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.STRIPE_WEBHOOK_SECRET;

  // Default chain: from() → update()/upsert() → eq() resolves
  mockFrom.mockImplementation(() => ({
    update: mockUpdate,
    upsert: mockUpsert,
  }));
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ error: null });
  mockUpsert.mockResolvedValue({ error: null });
});

describe("Stripe webhook — urgent promotion with boosted_until", () => {
  const urgentEvent = {
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: {
          listing_id: "listing-boost",
          promotion_type: "urgent",
          duration_days: "3",
        },
      },
    },
  };

  it("sets is_urgent and boosted_until for urgent promotions", async () => {
    await POST(makeWebhookRequest(urgentEvent));

    expect(mockUpdate).toHaveBeenCalled();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_urgent).toBe(true);
    expect(updateArg.boosted_until).toBeDefined();
    const boostedDate = new Date(updateArg.boosted_until);
    expect(boostedDate.getTime()).toBeGreaterThan(Date.now());
  });

  it("does NOT set is_promoted or promoted_until for urgent promotions", async () => {
    await POST(makeWebhookRequest(urgentEvent));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_promoted).toBeUndefined();
    expect(updateArg.promoted_until).toBeUndefined();
  });

  it("always sets status to active", async () => {
    await POST(makeWebhookRequest(urgentEvent));
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.status).toBe("active");
  });
});

describe("Stripe webhook — dealer subscription checkout", () => {
  const dealerCheckoutEvent = {
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: {
          type: "dealer_subscription",
          user_id: "user-abc-123",
          plan_tier: "pro",
          billing_interval: "monthly",
        },
        customer: "cus_test123",
        subscription: "sub_test456",
      },
    },
  };

  it("upserts dealer_shops row with correct data", async () => {
    await POST(makeWebhookRequest(dealerCheckoutEvent));

    expect(mockUpsert).toHaveBeenCalledOnce();
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.user_id).toBe("user-abc-123");
    expect(upsertArg.stripe_customer_id).toBe("cus_test123");
    expect(upsertArg.stripe_subscription_id).toBe("sub_test456");
    expect(upsertArg.plan_status).toBe("active");
    expect(upsertArg.shop_name).toBe("My Shop");
  });

  it("stores plan_tier from metadata", async () => {
    await POST(makeWebhookRequest(dealerCheckoutEvent));

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.plan_tier).toBe("pro");
  });

  it("stores billing_interval from metadata", async () => {
    await POST(makeWebhookRequest(dealerCheckoutEvent));

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.billing_interval).toBe("monthly");
  });

  it("stores business tier from metadata", async () => {
    const bizEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            type: "dealer_subscription",
            user_id: "user-biz-789",
            plan_tier: "business",
            billing_interval: "yearly",
          },
          customer: "cus_biz",
          subscription: "sub_biz",
        },
      },
    };
    await POST(makeWebhookRequest(bizEvent));

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.plan_tier).toBe("business");
    expect(upsertArg.billing_interval).toBe("yearly");
  });

  it("defaults plan_tier to 'pro' when metadata missing", async () => {
    const legacyEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            type: "dealer_subscription",
            user_id: "user-legacy",
          },
          customer: "cus_legacy",
          subscription: "sub_legacy",
        },
      },
    };
    await POST(makeWebhookRequest(legacyEvent));

    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.plan_tier).toBe("pro");
    expect(upsertArg.billing_interval).toBe("monthly");
  });

  it("updates profile is_pro_seller to true", async () => {
    await POST(makeWebhookRequest(dealerCheckoutEvent));

    // The second call to from() should be for profiles
    expect(mockUpdate).toHaveBeenCalled();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_pro_seller).toBe(true);
  });

  it("handles customer as object (not string)", async () => {
    const eventWithObjCustomer = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            type: "dealer_subscription",
            user_id: "user-xyz",
            plan_tier: "pro",
            billing_interval: "monthly",
          },
          customer: { id: "cus_obj123" },
          subscription: { id: "sub_obj456" },
        },
      },
    };

    await POST(makeWebhookRequest(eventWithObjCustomer));
    const upsertArg = mockUpsert.mock.calls[0][0];
    expect(upsertArg.stripe_customer_id).toBe("cus_obj123");
    expect(upsertArg.stripe_subscription_id).toBe("sub_obj456");
  });
});

describe("Stripe webhook — subscription lifecycle events", () => {
  const makeSubscriptionEvent = (
    type: string,
    status: string,
    metadata: Record<string, string> = {},
    periodEnd?: number,
  ) => ({
    type,
    data: {
      object: {
        metadata: {
          type: "dealer_subscription",
          user_id: "user-sub-123",
          ...metadata,
        },
        status,
        current_period_end: periodEnd ?? Math.floor(Date.now() / 1000) + 86400,
      },
    },
  });

  it("sets plan_status to active for active subscriptions", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "active",
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_status).toBe("active");
  });

  it("sets plan_status to active for trialing subscriptions", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "trialing",
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_status).toBe("active");
  });

  it("sets plan_status to past_due for past_due subscriptions", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "past_due",
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_status).toBe("past_due");
  });

  it("sets plan_status to cancelled for cancelled subscriptions", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.deleted",
      "canceled",
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_status).toBe("cancelled");
  });

  it("sets is_pro_seller to false when subscription is cancelled", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.deleted",
      "canceled",
    );
    await POST(makeWebhookRequest(event));

    // Second update call should be for profiles
    const profileUpdate = mockUpdate.mock.calls.find(
      (call) => call[0].is_pro_seller !== undefined,
    );
    expect(profileUpdate).toBeDefined();
    expect(profileUpdate![0].is_pro_seller).toBe(false);
  });

  it("updates plan_tier from subscription metadata on upgrade", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "active",
      { plan_tier: "business", billing_interval: "yearly" },
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_tier).toBe("business");
    expect(updateArg.billing_interval).toBe("yearly");
  });

  it("reverts plan_tier to starter on cancellation", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.deleted",
      "canceled",
      { plan_tier: "pro" },
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_tier).toBe("starter");
  });

  it("does NOT revert plan_tier on past_due (grace period)", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "past_due",
      { plan_tier: "business" },
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_tier).toBe("business");
  });

  it("sets plan_expires_at from current_period_end", async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 2592000; // +30 days
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "active",
      {},
      futureTimestamp,
    );
    await POST(makeWebhookRequest(event));

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.plan_expires_at).toBeDefined();
    const expiresDate = new Date(updateArg.plan_expires_at);
    expect(expiresDate.getTime()).toBeGreaterThan(Date.now());
  });
});
