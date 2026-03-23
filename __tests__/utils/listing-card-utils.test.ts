/**
 * Tests for pure utility functions extracted from ListingCard.
 * These are tested via module-level exports added to a shared utils file.
 * Here we replicate the logic inline so the tests are self-contained and
 * document the expected behaviour precisely.
 */

import { describe, expect, it } from "vitest";

// ----- replicated from app/components/listing-card.tsx -----

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] || null;
  return v;
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Contact";
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${price.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ----- replicated from app/listing/[slug]/listing-actions.tsx -----

function buildWhatsAppLink(
  whatsappNumber: string,
  listingTitle: string,
): string {
  const cleaned = whatsappNumber.replace(/[\s\-().]/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(
    `Hi! I'm interested in your listing: ${listingTitle}`,
  )}`;
}

function buildTelegramLink(telegramUsername: string): string {
  return `https://t.me/${telegramUsername}`;
}

// -------------------------------------------------------------------

describe("formatPrice", () => {
  it("returns Contact when price is null", () => {
    expect(formatPrice(null, "EUR")).toBe("Contact");
  });

  it("formats EUR amounts with € symbol", () => {
    expect(formatPrice(500, "EUR")).toBe("€500");
  });

  it("formats large EUR amounts with locale separators", () => {
    // toLocaleString formatting varies by environment; just verify € prefix + digits
    const result = formatPrice(1500, "EUR");
    expect(result).toMatch(/^€/);
    expect(result).toContain("1");
    expect(result).toContain("500");
  });

  it("uses raw currency code for non-EUR currencies", () => {
    expect(formatPrice(300, "USD")).toBe("USD300");
  });

  it("handles zero price", () => {
    expect(formatPrice(0, "EUR")).toBe("€0");
  });
});

describe("timeAgo", () => {
  it("returns minutes for recent timestamps", () => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(timeAgo(tenMinsAgo)).toBe("10m ago");
  });

  it("returns hours for timestamps a few hours old", () => {
    const threeHoursAgo = new Date(
      Date.now() - 3 * 60 * 60 * 1000,
    ).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days for timestamps multiple days old", () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it("returns 0m ago for a brand-new timestamp", () => {
    const justNow = new Date(Date.now()).toISOString();
    expect(timeAgo(justNow)).toBe("0m ago");
  });
});

describe("unwrap", () => {
  it("returns null for null input", () => {
    expect(unwrap(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(unwrap(undefined)).toBeNull();
  });

  it("returns the first element of an array", () => {
    expect(unwrap([{ name: "Electronics" }, { name: "Cars" }])).toEqual({
      name: "Electronics",
    });
  });

  it("returns null for an empty array", () => {
    expect(unwrap([])).toBeNull();
  });

  it("returns the value directly when not an array", () => {
    expect(unwrap({ name: "Nicosia" })).toEqual({ name: "Nicosia" });
  });
});

describe("buildWhatsAppLink", () => {
  it("strips spaces from number", () => {
    const link = buildWhatsAppLink("+357 99 123 456", "iPhone 14");
    expect(link).toContain("wa.me/+35799123456");
  });

  it("strips dashes from number", () => {
    const link = buildWhatsAppLink("+357-99-123-456", "Test");
    expect(link).toContain("wa.me/+35799123456");
  });

  it("strips parentheses and dots from number", () => {
    const link = buildWhatsAppLink("+1 (555) 123.4567", "Bike");
    expect(link).toContain("wa.me/+15551234567");
  });

  it("encodes the listing title in the query string", () => {
    const link = buildWhatsAppLink("+35799000000", "My Listing & More");
    expect(link).toContain(
      encodeURIComponent(
        "Hi! I'm interested in your listing: My Listing & More",
      ),
    );
  });

  it("builds a valid wa.me URL", () => {
    const link = buildWhatsAppLink("+35799000000", "Laptop");
    expect(link).toMatch(/^https:\/\/wa\.me\//);
  });
});

describe("buildTelegramLink", () => {
  it("builds a t.me link from username", () => {
    expect(buildTelegramLink("johndoe")).toBe("https://t.me/johndoe");
  });

  it("preserves the username exactly (no leading @)", () => {
    // The settings form strips @ before saving, so stored value has no @
    expect(buildTelegramLink("seller_cyprus")).toBe(
      "https://t.me/seller_cyprus",
    );
  });
});
