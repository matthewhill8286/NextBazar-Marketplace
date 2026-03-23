import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockUpdate, mockEq } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: mockUpdate,
      eq: mockEq,
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "test-webhook-secret-xyz";

/** Sign a raw body string with the test secret, matching Coinbase's HMAC-SHA256 scheme */
function signBody(body: string, secret = WEBHOOK_SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function makeWebhookRequest(
  event: object,
  options: { sign?: boolean; secret?: string; signature?: string } = {},
): NextRequest {
  const body = JSON.stringify(event);
  const sig =
    options.signature ??
    (options.sign !== false
      ? signBody(body, options.secret ?? WEBHOOK_SECRET)
      : "bad-sig");

  return new NextRequest("http://localhost/api/webhooks/coinbase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cc-webhook-signature": sig,
    },
    body,
  });
}

// ── Canonical event payloads ─────────────────────────────────────────────────

function makeChargeEvent(type: string, metadata: Record<string, string> = {}) {
  return {
    event: {
      type,
      data: {
        id: "charge-test-1",
        metadata: {
          listing_id: "listing-1",
          promotion_type: "featured",
          duration_days: "7",
          ...metadata,
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  process.env.COINBASE_COMMERCE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  // Default: update().eq() resolves without error
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockResolvedValue({ error: null });
});

// ---------------------------------------------------------------------------

import { POST } from "@/app/api/webhooks/coinbase/route";

describe("POST /api/webhooks/coinbase", () => {
  // ── Signature verification ────────────────────────────────────────────────

  it("returns 400 when signature is missing and secret is configured", async () => {
    const body = JSON.stringify(makeChargeEvent("charge:confirmed"));
    const req = new NextRequest("http://localhost/api/webhooks/coinbase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No x-cc-webhook-signature header
      body,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing signature");
  });

  it("returns 400 when the signature does not match the body", async () => {
    const event = makeChargeEvent("charge:confirmed");
    const req = makeWebhookRequest(event, { signature: "deadbeef00000000" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid signature");
  });

  it("returns 200 when a valid HMAC-SHA256 signature is provided", async () => {
    const res = await POST(
      makeWebhookRequest(makeChargeEvent("charge:confirmed")),
    );
    expect(res.status).toBe(200);
  });

  it("skips signature verification when COINBASE_COMMERCE_WEBHOOK_SECRET is not set", async () => {
    delete process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
    // Use a totally wrong signature — should still succeed
    const event = makeChargeEvent("charge:confirmed");
    const req = makeWebhookRequest(event, { signature: "wrong-sig" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ── charge:confirmed ──────────────────────────────────────────────────────

  it("returns { received: true } for charge:confirmed", async () => {
    const res = await POST(
      makeWebhookRequest(makeChargeEvent("charge:confirmed")),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });

  it("activates featured promotion when charge:confirmed fires", async () => {
    await POST(makeWebhookRequest(makeChargeEvent("charge:confirmed")));
    expect(mockUpdate).toHaveBeenCalledOnce();
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_promoted).toBe(true);
    expect(updateArg.promoted_until).toBeDefined();
    expect(new Date(updateArg.promoted_until).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("calls .eq('id', listingId) for charge:confirmed", async () => {
    await POST(makeWebhookRequest(makeChargeEvent("charge:confirmed")));
    expect(mockEq).toHaveBeenCalledWith("id", "listing-1");
  });

  it("sets promoted_until ~7 days in the future for featured", async () => {
    await POST(makeWebhookRequest(makeChargeEvent("charge:confirmed")));
    const { promoted_until } = mockUpdate.mock.calls[0][0];
    const diff = new Date(promoted_until).getTime() - Date.now();
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    expect(diff).toBeGreaterThan(sixDaysMs);
    expect(diff).toBeLessThan(eightDaysMs);
  });

  // ── charge:completed ──────────────────────────────────────────────────────

  it("also activates promotion on charge:completed", async () => {
    await POST(makeWebhookRequest(makeChargeEvent("charge:completed")));
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockUpdate.mock.calls[0][0].is_promoted).toBe(true);
  });

  it("returns { received: true } for charge:completed", async () => {
    const res = await POST(
      makeWebhookRequest(makeChargeEvent("charge:completed")),
    );
    expect((await res.json()).received).toBe(true);
  });

  // ── urgent promotion ──────────────────────────────────────────────────────

  it("sets is_urgent for urgent promotion type", async () => {
    const event = makeChargeEvent("charge:confirmed", {
      promotion_type: "urgent",
      duration_days: "3",
    });
    await POST(makeWebhookRequest(event));
    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.is_urgent).toBe(true);
    expect(updateArg.is_promoted).toBeUndefined();
    expect(updateArg.promoted_until).toBeUndefined();
  });

  it("calls .eq('id', listing-1) for urgent promotion", async () => {
    const event = makeChargeEvent("charge:confirmed", {
      promotion_type: "urgent",
    });
    await POST(makeWebhookRequest(event));
    expect(mockEq).toHaveBeenCalledWith("id", "listing-1");
  });

  // ── charge:failed ─────────────────────────────────────────────────────────

  it("returns { received: true } for charge:failed without touching DB", async () => {
    const res = await POST(
      makeWebhookRequest(makeChargeEvent("charge:failed")),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── Unknown / irrelevant event types ─────────────────────────────────────

  it("returns { received: true } for an unknown event type without touching DB", async () => {
    const res = await POST(
      makeWebhookRequest(makeChargeEvent("charge:pending")),
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── Missing metadata ──────────────────────────────────────────────────────

  it("does not update DB when listing_id is missing from metadata", async () => {
    const event = {
      event: {
        type: "charge:confirmed",
        data: { id: "charge-1", metadata: { promotion_type: "featured" } },
      },
    };
    const res = await POST(makeWebhookRequest(event));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not update DB when promotion_type is missing from metadata", async () => {
    const event = {
      event: {
        type: "charge:confirmed",
        data: { id: "charge-1", metadata: { listing_id: "listing-1" } },
      },
    };
    const res = await POST(makeWebhookRequest(event));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not update DB when metadata is entirely absent", async () => {
    const event = {
      event: { type: "charge:confirmed", data: { id: "charge-1" } },
    };
    const res = await POST(makeWebhookRequest(event));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // ── Malformed body ────────────────────────────────────────────────────────

  it("returns 400 for a non-JSON body", async () => {
    // Skip signing since we want to test JSON parse failure
    delete process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
    const req = new NextRequest("http://localhost/api/webhooks/coinbase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cc-webhook-signature": "irrelevant",
      },
      body: "this is not json {{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid JSON");
  });
});
