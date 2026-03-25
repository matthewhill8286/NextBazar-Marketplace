import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock PROMOTION_PRICES from lib/stripe (crypto route imports it for price data)
vi.mock("@/lib/stripe", () => ({
  PROMOTION_PRICES: {
    featured: {
      priceId: "price_featured_test",
      name: "Featured Listing",
      description: "Top placement + highlighted for 7 days",
      amount: 499,
      duration: 7,
    },
    urgent: {
      priceId: "price_urgent_test",
      name: "Quick Boost",
      description: "Boosted visibility + priority in search for 3 days",
      amount: 299,
      duration: 3,
    },
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/checkout/crypto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  listingId: "listing-1",
  promotionType: "featured",
  origin: "https://next-bazar.com",
};

const MOCK_COINBASE_RESPONSE = {
  data: {
    id: "charge-abc-123",
    hosted_url: "https://commerce.coinbase.com/charges/charge-abc-123",
    expires_at: "2026-03-22T13:00:00Z",
  },
};

// ---------------------------------------------------------------------------

let originalFetch: typeof fetch;

beforeEach(() => {
  vi.clearAllMocks();
  originalFetch = global.fetch;

  // Happy-path default: Coinbase returns 200 with a charge
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => MOCK_COINBASE_RESPONSE,
  } as Response);

  process.env.COINBASE_COMMERCE_API_KEY = "test-api-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.COINBASE_COMMERCE_API_KEY;
});

// ---------------------------------------------------------------------------

import { POST } from "@/app/api/checkout/crypto/route";

describe("POST /api/checkout/crypto", () => {
  // ── Input validation ──────────────────────────────────────────────────────

  it("returns 400 when listingId is missing", async () => {
    const res = await POST(
      makeRequest({
        promotionType: "featured",
        origin: "https://next-bazar.com",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  it("returns 400 when promotionType is missing", async () => {
    const res = await POST(
      makeRequest({ listingId: "listing-1", origin: "https://next-bazar.com" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  it("returns 400 when origin is missing", async () => {
    const res = await POST(
      makeRequest({ listingId: "listing-1", promotionType: "featured" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing required fields");
  });

  it("returns 400 when promotionType is not valid", async () => {
    const res = await POST(
      makeRequest({ ...VALID_BODY, promotionType: "platinum" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid promotion type");
  });

  // ── API key guard ─────────────────────────────────────────────────────────

  it("returns 503 when COINBASE_COMMERCE_API_KEY is not set", async () => {
    delete process.env.COINBASE_COMMERCE_API_KEY;
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("Crypto payments are not configured");
  });

  it("does NOT call the Coinbase API when the key is missing", async () => {
    delete process.env.COINBASE_COMMERCE_API_KEY;
    await POST(makeRequest(VALID_BODY));
    expect(fetch).not.toHaveBeenCalled();
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  it("returns 200 with hosted_url and charge_id on success", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hosted_url).toBe(
      "https://commerce.coinbase.com/charges/charge-abc-123",
    );
    expect(body.charge_id).toBe("charge-abc-123");
  });

  it("returns expires_at from Coinbase in the response", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json();
    expect(body.expires_at).toBe("2026-03-22T13:00:00Z");
  });

  // ── Coinbase API request construction ─────────────────────────────────────

  it("calls the Coinbase Commerce charges endpoint", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(fetch).toHaveBeenCalledOnce();
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("api.commerce.coinbase.com/charges");
  });

  it("sends the API key in the X-CC-Api-Key header", async () => {
    await POST(makeRequest(VALID_BODY));
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["X-CC-Api-Key"]).toBe("test-api-key");
  });

  it("sends the correct API version header", async () => {
    await POST(makeRequest(VALID_BODY));
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["X-CC-Version"]).toBe("2018-03-22");
  });

  it("sends listing metadata in the charge body", async () => {
    await POST(
      makeRequest({
        ...VALID_BODY,
        listingId: "listing-42",
        promotionType: "urgent",
      }),
    );
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.metadata.listing_id).toBe("listing-42");
    expect(body.metadata.promotion_type).toBe("urgent");
    expect(body.metadata.duration_days).toBe("3"); // urgent is 3 days
  });

  it("sends correct EUR amount for featured promotion (€4.99)", async () => {
    await POST(makeRequest(VALID_BODY)); // featured
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.local_price.amount).toBe("4.99");
    expect(body.local_price.currency).toBe("EUR");
  });

  it("sends correct EUR amount for urgent promotion (€2.99)", async () => {
    await POST(makeRequest({ ...VALID_BODY, promotionType: "urgent" }));
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.local_price.amount).toBe("2.99");
    expect(body.local_price.currency).toBe("EUR");
  });

  it("uses fixed_price pricing type", async () => {
    await POST(makeRequest(VALID_BODY));
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.pricing_type).toBe("fixed_price");
  });

  it("sets redirect_url to origin/promote/success with listing_id and method=crypto", async () => {
    await POST(makeRequest(VALID_BODY));
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.redirect_url).toContain("https://next-bazar.com");
    expect(body.redirect_url).toContain("listing-1");
    expect(body.redirect_url).toContain("method=crypto");
  });

  it("sets cancel_url to origin/promote/{listingId}", async () => {
    await POST(makeRequest(VALID_BODY));
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.cancel_url).toBe("https://next-bazar.com/promote/listing-1");
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it("returns 500 when Coinbase API returns a non-OK response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid API key" } }),
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Invalid API key");
  });

  it("returns 500 with a generic message when Coinbase error has no message", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Failed to create crypto charge");
  });

  it("returns 500 when fetch itself throws a network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network request failed"),
    );
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Network request failed");
  });
});
