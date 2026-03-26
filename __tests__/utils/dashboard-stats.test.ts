/**
 * Tests for the dashboard stats computation logic from dashboard/page.tsx.
 * The stats (activeCount, totalViews, totalFavs, totalMessages) are computed
 * from the listings array. We replicate the logic here to verify correctness.
 */

import { describe, expect, it } from "vitest";

// Minimal listing type matching what the dashboard page uses
type MinimalListing = {
  status: string;
  view_count: number;
  favorite_count: number;
  message_count: number;
};

// Replicated from app/[locale]/dashboard/page.tsx
function computeStats(listings: MinimalListing[]) {
  return {
    activeCount: listings.filter((l) => l.status === "active").length,
    totalViews: listings.reduce((s, l) => s + (l.view_count || 0), 0),
    totalFavs: listings.reduce((s, l) => s + (l.favorite_count || 0), 0),
    totalMessages: listings.reduce((s, l) => s + (l.message_count || 0), 0),
  };
}

const sampleListings: MinimalListing[] = [
  { status: "active", view_count: 100, favorite_count: 10, message_count: 5 },
  { status: "active", view_count: 200, favorite_count: 20, message_count: 3 },
  { status: "sold", view_count: 150, favorite_count: 15, message_count: 8 },
  { status: "expired", view_count: 50, favorite_count: 5, message_count: 0 },
  { status: "draft", view_count: 0, favorite_count: 0, message_count: 0 },
];

describe("Dashboard stats computation", () => {
  it("counts only active listings for activeCount", () => {
    const { activeCount } = computeStats(sampleListings);
    expect(activeCount).toBe(2);
  });

  it("sums view_count across ALL listings (not just active)", () => {
    const { totalViews } = computeStats(sampleListings);
    expect(totalViews).toBe(500); // 100 + 200 + 150 + 50 + 0
  });

  it("sums favorite_count across ALL listings", () => {
    const { totalFavs } = computeStats(sampleListings);
    expect(totalFavs).toBe(50); // 10 + 20 + 15 + 5 + 0
  });

  it("sums message_count across ALL listings", () => {
    const { totalMessages } = computeStats(sampleListings);
    expect(totalMessages).toBe(16); // 5 + 3 + 8 + 0 + 0
  });

  it("returns zeroes for an empty listings array", () => {
    const stats = computeStats([]);
    expect(stats.activeCount).toBe(0);
    expect(stats.totalViews).toBe(0);
    expect(stats.totalFavs).toBe(0);
    expect(stats.totalMessages).toBe(0);
  });

  it("handles listings where all are sold (no active)", () => {
    const allSold: MinimalListing[] = [
      { status: "sold", view_count: 10, favorite_count: 1, message_count: 2 },
      { status: "sold", view_count: 20, favorite_count: 3, message_count: 4 },
    ];
    const stats = computeStats(allSold);
    expect(stats.activeCount).toBe(0);
    expect(stats.totalViews).toBe(30);
    expect(stats.totalFavs).toBe(4);
    expect(stats.totalMessages).toBe(6);
  });

  it("treats falsy view_count/favorite_count/message_count as 0", () => {
    const withFalsy = [
      { status: "active", view_count: 0, favorite_count: 0, message_count: 0 },
    ] as MinimalListing[];
    const stats = computeStats(withFalsy);
    expect(stats.activeCount).toBe(1);
    expect(stats.totalViews).toBe(0);
    expect(stats.totalFavs).toBe(0);
    expect(stats.totalMessages).toBe(0);
  });

  it("updates correctly when a listing changes from sold to active", () => {
    const before: MinimalListing[] = [
      {
        status: "sold",
        view_count: 100,
        favorite_count: 10,
        message_count: 5,
      },
    ];
    expect(computeStats(before).activeCount).toBe(0);

    // Simulate re-activation
    const after: MinimalListing[] = [
      {
        status: "active",
        view_count: 100,
        favorite_count: 10,
        message_count: 5,
      },
    ];
    expect(computeStats(after).activeCount).toBe(1);
    // Views/favs/messages stay the same — they're totals regardless of status
    expect(computeStats(after).totalViews).toBe(100);
  });
});
