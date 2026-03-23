/**
 * Unit tests for listing-related pure utility functions:
 *   - expiryBadge  (listings-client.tsx)
 *   - recently-viewed localStorage helpers (listing-detail.tsx / home-client.tsx)
 */

import { describe, expect, it } from "vitest";

// ─── Replicated from app/[locale]/dashboard/listings/listings-client.tsx ─────

function expiryBadge(
  expiresAt: string | null,
  status: string,
): { label: string; critical: boolean } | null {
  if (status !== "active" || !expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (days > 7) return null;
  if (days <= 0) return null;
  const label = days === 1 ? "Expires today" : `Expires in ${days}d`;
  const critical = days <= 3;
  return { label, critical };
}

// ─── Replicated from app/[locale]/listing/[slug]/listing-detail.tsx ───────────
// The recently-viewed tracking logic — stores up to 12 IDs, deduplicated,
// newest first.

function trackRecentlyViewed(storedJson: string | null, newId: string): string[] {
  const prev: string[] = storedJson ? JSON.parse(storedJson) : [];
  return [newId, ...prev.filter((id) => id !== newId)].slice(0, 12);
}

// ─── Replicated from app/[locale]/home-client.tsx ────────────────────────────
// The home page preserves the localStorage order when mapping fetched listings.

function orderByStoredIds<T extends { id: string }>(
  ids: string[],
  listings: T[],
): T[] {
  return ids
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is T => l !== undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// expiryBadge
// ─────────────────────────────────────────────────────────────────────────────

describe("expiryBadge", () => {
  function daysFromNow(days: number): string {
    return new Date(Date.now() + days * 86_400_000).toISOString();
  }

  it("returns null for non-active listings", () => {
    expect(expiryBadge(daysFromNow(2), "expired")).toBeNull();
    expect(expiryBadge(daysFromNow(2), "sold")).toBeNull();
    expect(expiryBadge(daysFromNow(2), "paused")).toBeNull();
  });

  it("returns null when expiresAt is null", () => {
    expect(expiryBadge(null, "active")).toBeNull();
  });

  it("returns null when listing expires more than 7 days away", () => {
    expect(expiryBadge(daysFromNow(8), "active")).toBeNull();
    expect(expiryBadge(daysFromNow(30), "active")).toBeNull();
  });

  it("returns null when listing is already expired (days <= 0)", () => {
    expect(expiryBadge(daysFromNow(-1), "active")).toBeNull();
    expect(expiryBadge(daysFromNow(0), "active")).toBeNull();
  });

  it("returns badge for listing expiring in exactly 1 day", () => {
    const badge = expiryBadge(daysFromNow(1), "active");
    expect(badge).not.toBeNull();
    expect(badge!.label).toBe("Expires today");
    expect(badge!.critical).toBe(true);
  });

  it("returns critical=true for listings expiring within 3 days", () => {
    const badge2 = expiryBadge(daysFromNow(2), "active");
    const badge3 = expiryBadge(daysFromNow(3), "active");
    expect(badge2!.critical).toBe(true);
    expect(badge3!.critical).toBe(true);
  });

  it("returns critical=false for listings expiring in 4-7 days", () => {
    const badge4 = expiryBadge(daysFromNow(4), "active");
    const badge7 = expiryBadge(daysFromNow(7), "active");
    expect(badge4!.critical).toBe(false);
    expect(badge7!.critical).toBe(false);
  });

  it("returns correct label for multi-day expiry", () => {
    const badge = expiryBadge(daysFromNow(5), "active");
    expect(badge!.label).toBe("Expires in 5d");
  });

  it("returns the boundary case of 7 days as non-critical", () => {
    const badge = expiryBadge(daysFromNow(7), "active");
    expect(badge).not.toBeNull();
    expect(badge!.critical).toBe(false);
    expect(badge!.label).toBe("Expires in 7d");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// trackRecentlyViewed
// ─────────────────────────────────────────────────────────────────────────────

describe("trackRecentlyViewed", () => {
  it("starts a new list when storage is null", () => {
    expect(trackRecentlyViewed(null, "id-1")).toEqual(["id-1"]);
  });

  it("prepends the new ID to an existing list", () => {
    const existing = JSON.stringify(["id-2", "id-3"]);
    expect(trackRecentlyViewed(existing, "id-1")).toEqual(["id-1", "id-2", "id-3"]);
  });

  it("deduplicates: moves existing ID to the front instead of duplicating", () => {
    const existing = JSON.stringify(["id-1", "id-2", "id-3"]);
    expect(trackRecentlyViewed(existing, "id-2")).toEqual(["id-2", "id-1", "id-3"]);
  });

  it("removes the ID from its old position before prepending", () => {
    const existing = JSON.stringify(["id-1", "id-2", "id-3"]);
    const result = trackRecentlyViewed(existing, "id-3");
    // id-3 should appear only once, at the front
    expect(result.filter((id) => id === "id-3")).toHaveLength(1);
    expect(result[0]).toBe("id-3");
  });

  it("caps the list at 12 entries", () => {
    const twelveIds = Array.from({ length: 12 }, (_, i) => `id-${i + 1}`);
    const existing = JSON.stringify(twelveIds);
    const result = trackRecentlyViewed(existing, "id-new");
    expect(result).toHaveLength(12);
    expect(result[0]).toBe("id-new");
    // The oldest entry (id-12) should be dropped
    expect(result).not.toContain("id-12");
  });

  it("does not exceed 12 even when starting from exactly 12 unique entries", () => {
    const twelveIds = Array.from({ length: 12 }, (_, i) => `id-${i}`);
    const existing = JSON.stringify(twelveIds);
    const result = trackRecentlyViewed(existing, "brand-new");
    expect(result.length).toBeLessThanOrEqual(12);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// orderByStoredIds
// ─────────────────────────────────────────────────────────────────────────────

describe("orderByStoredIds", () => {
  const listings = [
    { id: "id-1", title: "A" },
    { id: "id-2", title: "B" },
    { id: "id-3", title: "C" },
  ];

  it("orders listings to match the stored ID array", () => {
    const result = orderByStoredIds(["id-3", "id-1", "id-2"], listings);
    expect(result.map((l) => l.id)).toEqual(["id-3", "id-1", "id-2"]);
  });

  it("skips IDs not present in the fetched listings (e.g. deleted listings)", () => {
    const result = orderByStoredIds(["id-1", "id-deleted", "id-3"], listings);
    expect(result.map((l) => l.id)).toEqual(["id-1", "id-3"]);
  });

  it("returns an empty array when stored IDs is empty", () => {
    expect(orderByStoredIds([], listings)).toEqual([]);
  });

  it("returns an empty array when no IDs match the listings", () => {
    expect(orderByStoredIds(["id-x", "id-y"], listings)).toEqual([]);
  });

  it("preserves the most-recently-viewed-first order from localStorage", () => {
    // id-2 was viewed most recently (first in stored list)
    const result = orderByStoredIds(["id-2", "id-3", "id-1"], listings);
    expect(result[0].id).toBe("id-2");
  });
});
