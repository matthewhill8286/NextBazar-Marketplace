/**
 * Unit tests for the pure helper functions used in the saved-searches feature.
 *
 * Functions are replicated inline (same pattern as listing-card-utils.test.ts)
 * because they live inside React components and are not exported separately.
 */

import { describe, expect, it } from "vitest";

// ─── Replicated from app/components/save-search-button.tsx ───────────────────

function buildParams(
  query: string,
  categorySlug: string,
  subcategorySlug: string,
  locationSlug: string,
  priceMin: string,
  priceMax: string,
  sortBy: string,
) {
  return {
    query: query || null,
    category_slug: categorySlug || null,
    subcategory_slug: subcategorySlug || null,
    location_slug: locationSlug || null,
    price_min: priceMin ? Number(priceMin) : null,
    price_max: priceMax ? Number(priceMax) : null,
    sort_by: sortBy || "newest",
  };
}

function buildName(
  query: string,
  categorySlug: string,
  locationSlug: string,
  priceMax: string,
): string {
  const parts: string[] = [];
  if (query) parts.push(`"${query}"`);
  if (categorySlug) parts.push(categorySlug);
  if (locationSlug) parts.push(`in ${locationSlug}`);
  if (priceMax) parts.push(`under €${priceMax}`);
  return parts.length ? parts.join(" ") : "All listings";
}

// ─── Replicated from app/[locale]/dashboard/saved-searches/saved-searches-client.tsx ──

type SavedSearch = {
  id: string;
  name: string;
  query: string | null;
  category_slug: string | null;
  subcategory_slug: string | null;
  location_slug: string | null;
  price_min: number | null;
  price_max: number | null;
  sort_by: string | null;
  created_at: string;
  last_notified_at: string | null;
};

function buildSearchUrl(s: SavedSearch): string {
  const params = new URLSearchParams();
  if (s.query) params.set("q", s.query);
  if (s.category_slug) params.set("category", s.category_slug);
  if (s.subcategory_slug) params.set("subcategory", s.subcategory_slug);
  if (s.location_slug) params.set("location", s.location_slug);
  if (s.sort_by && s.sort_by !== "newest") params.set("sort", s.sort_by);
  if (s.price_min != null) params.set("priceMin", String(s.price_min));
  if (s.price_max != null) params.set("priceMax", String(s.price_max));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

function buildTags(s: SavedSearch): string[] {
  const tags: string[] = [];
  if (s.category_slug) tags.push(s.category_slug);
  if (s.location_slug) tags.push(s.location_slug);
  if (s.price_min != null && s.price_max != null)
    tags.push(`€${s.price_min}–€${s.price_max}`);
  else if (s.price_min != null) tags.push(`from €${s.price_min}`);
  else if (s.price_max != null) tags.push(`up to €${s.price_max}`);
  return tags;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSearch(overrides: Partial<SavedSearch> = {}): SavedSearch {
  return {
    id: "ss-1",
    name: "Test search",
    query: null,
    category_slug: null,
    subcategory_slug: null,
    location_slug: null,
    price_min: null,
    price_max: null,
    sort_by: "newest",
    created_at: "2026-01-01T00:00:00Z",
    last_notified_at: null,
    ...overrides,
  };
}

// ─── Tests: buildParams ───────────────────────────────────────────────────────

describe("buildParams", () => {
  it("converts empty strings to null", () => {
    const p = buildParams("", "", "", "", "", "", "newest");
    expect(p.query).toBeNull();
    expect(p.category_slug).toBeNull();
    expect(p.subcategory_slug).toBeNull();
    expect(p.location_slug).toBeNull();
    expect(p.price_min).toBeNull();
    expect(p.price_max).toBeNull();
  });

  it("preserves non-empty string values", () => {
    const p = buildParams("iphone", "electronics", "", "nicosia", "", "", "newest");
    expect(p.query).toBe("iphone");
    expect(p.category_slug).toBe("electronics");
    expect(p.location_slug).toBe("nicosia");
  });

  it("converts price strings to numbers", () => {
    const p = buildParams("", "", "", "", "100", "500", "newest");
    expect(p.price_min).toBe(100);
    expect(p.price_max).toBe(500);
  });

  it("falls back to newest when sortBy is empty", () => {
    const p = buildParams("", "", "", "", "", "", "");
    expect(p.sort_by).toBe("newest");
  });

  it("preserves non-default sort values", () => {
    const p = buildParams("", "", "", "", "", "", "price_low");
    expect(p.sort_by).toBe("price_low");
  });
});

// ─── Tests: buildName ────────────────────────────────────────────────────────

describe("buildName", () => {
  it("returns 'All listings' when no filters are set", () => {
    expect(buildName("", "", "", "")).toBe("All listings");
  });

  it("includes query in double quotes", () => {
    expect(buildName("iphone", "", "", "")).toBe('"iphone"');
  });

  it("includes category slug", () => {
    expect(buildName("", "electronics", "", "")).toBe("electronics");
  });

  it("prefixes location slug with 'in'", () => {
    expect(buildName("", "", "nicosia", "")).toBe("in nicosia");
  });

  it("prefixes price max with 'under €'", () => {
    expect(buildName("", "", "", "500")).toBe("under €500");
  });

  it("combines all parts in order: query, category, location, price", () => {
    expect(buildName("iphone", "electronics", "limassol", "800")).toBe(
      '"iphone" electronics in limassol under €800',
    );
  });

  it("combines query and location without category", () => {
    expect(buildName("bike", "", "paphos", "")).toBe('"bike" in paphos');
  });
});

// ─── Tests: buildSearchUrl ───────────────────────────────────────────────────

describe("buildSearchUrl", () => {
  it("returns /search with no params when all fields are null", () => {
    expect(buildSearchUrl(makeSearch())).toBe("/search");
  });

  it("adds q param for query", () => {
    expect(buildSearchUrl(makeSearch({ query: "laptop" }))).toBe(
      "/search?q=laptop",
    );
  });

  it("adds category param", () => {
    expect(buildSearchUrl(makeSearch({ category_slug: "electronics" }))).toBe(
      "/search?category=electronics",
    );
  });

  it("adds location param", () => {
    expect(buildSearchUrl(makeSearch({ location_slug: "nicosia" }))).toBe(
      "/search?location=nicosia",
    );
  });

  it("omits sort param when sort_by is 'newest' (default)", () => {
    const url = buildSearchUrl(makeSearch({ sort_by: "newest" }));
    expect(url).not.toContain("sort=");
  });

  it("includes sort param for non-default sort", () => {
    expect(buildSearchUrl(makeSearch({ sort_by: "price_low" }))).toContain(
      "sort=price_low",
    );
  });

  it("adds priceMin and priceMax params", () => {
    const url = buildSearchUrl(makeSearch({ price_min: 100, price_max: 500 }));
    expect(url).toContain("priceMin=100");
    expect(url).toContain("priceMax=500");
  });

  it("builds a full URL with all fields", () => {
    const url = buildSearchUrl(
      makeSearch({
        query: "iphone",
        category_slug: "electronics",
        location_slug: "limassol",
        price_max: 800,
        sort_by: "popular",
      }),
    );
    expect(url).toContain("q=iphone");
    expect(url).toContain("category=electronics");
    expect(url).toContain("location=limassol");
    expect(url).toContain("priceMax=800");
    expect(url).toContain("sort=popular");
  });
});

// ─── Tests: buildTags ────────────────────────────────────────────────────────

describe("buildTags", () => {
  it("returns empty array when no filter fields are set", () => {
    expect(buildTags(makeSearch())).toEqual([]);
  });

  it("includes category slug as a tag", () => {
    expect(buildTags(makeSearch({ category_slug: "vehicles" }))).toContain(
      "vehicles",
    );
  });

  it("includes location slug as a tag", () => {
    expect(buildTags(makeSearch({ location_slug: "larnaca" }))).toContain(
      "larnaca",
    );
  });

  it("shows a range tag when both price_min and price_max are set", () => {
    expect(
      buildTags(makeSearch({ price_min: 200, price_max: 1000 })),
    ).toContain("€200–€1000");
  });

  it("shows 'from €N' when only price_min is set", () => {
    expect(buildTags(makeSearch({ price_min: 50 }))).toContain("from €50");
  });

  it("shows 'up to €N' when only price_max is set", () => {
    expect(buildTags(makeSearch({ price_max: 300 }))).toContain("up to €300");
  });

  it("does not show a range tag when price fields are null", () => {
    const tags = buildTags(makeSearch({ price_min: null, price_max: null }));
    expect(tags.some((t) => t.includes("€"))).toBe(false);
  });

  it("combines category, location, and price tags", () => {
    const tags = buildTags(
      makeSearch({
        category_slug: "electronics",
        location_slug: "nicosia",
        price_max: 500,
      }),
    );
    expect(tags).toEqual(["electronics", "nicosia", "up to €500"]);
  });
});
