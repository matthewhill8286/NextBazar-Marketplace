import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted shared mock state
// ---------------------------------------------------------------------------

type ChainRecord = {
  eqs: Array<[string, unknown]>;
  gtes: Array<[string, unknown]>;
  ltes: Array<[string, unknown]>;
  ors: string[];
  textSearch: string | null;
  isRange: boolean;
  orders: Array<[string, unknown]>;
};

const { state } = vi.hoisted(() => ({
  state: {
    // Controls what embed() returns (null = no embedding → text fallback)
    embedResult: null as number[] | null,

    // RPC result
    rpcResult: { data: null as unknown[] | null, error: null as unknown },
    rpcArgs: null as Record<string, unknown> | null,

    // Full-text query result
    ftResult: { data: null as unknown[] | null, error: null as unknown },
    // ilike fallback result
    ilikeResult: { data: null as unknown[] | null, error: null as unknown },
    // Browse mode result
    browseResult: {
      data: null as unknown[] | null,
      count: 0,
      error: null as unknown,
    },

    // Slug → id lookup results (null means not found)
    categoryLookup: { data: { id: "cat-prop-id" } as { id: string } | null, error: null },
    subcategoryLookup: { data: { id: "sub-apt-id" } as { id: string } | null, error: null },
    locationLookup: { data: { id: "loc-nic-id" } as { id: string } | null, error: null },

    // Captured per-call listings chain records (one entry per from("listings") call)
    listingsChains: [] as ChainRecord[],
  },
}));

// ---------------------------------------------------------------------------
// Mock @/lib/embeddings
// ---------------------------------------------------------------------------

vi.mock("@/lib/embeddings", () => ({
  embed: vi.fn(async () => state.embedResult),
}));

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    // ── RPC (match_listings vector search) ──────────────────────────────────
    rpc: vi.fn(async (_name: string, args: Record<string, unknown>) => {
      state.rpcArgs = args;
      return state.rpcResult;
    }),

    // ── from() ──────────────────────────────────────────────────────────────
    from: vi.fn((table: string) => {
      // Slug → id resolution tables: simple single() chain
      if (table === "categories") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn(async () => state.categoryLookup),
        };
        return chain;
      }
      if (table === "subcategories") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn(async () => state.subcategoryLookup),
        };
        return chain;
      }
      if (table === "locations") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn(async () => state.locationLookup),
        };
        return chain;
      }

      // ── listings table: records all calls, returns mock data at terminal ──
      if (table === "listings") {
        const record: ChainRecord = {
          eqs: [],
          gtes: [],
          ltes: [],
          ors: [],
          textSearch: null,
          isRange: false,
          orders: [],
        };
        state.listingsChains.push(record);

        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn((col: string, val: unknown) => {
            record.eqs.push([col, val]);
            return chain;
          }),
          gte: vi.fn((col: string, val: unknown) => {
            record.gtes.push([col, val]);
            return chain;
          }),
          lte: vi.fn((col: string, val: unknown) => {
            record.ltes.push([col, val]);
            return chain;
          }),
          or: vi.fn((expr: string) => {
            record.ors.push(expr);
            return chain;
          }),
          textSearch: vi.fn((_col: string, val: string) => {
            record.textSearch = val;
            return chain;
          }),
          order: vi.fn((col: string, opts: unknown) => {
            record.orders.push([col, opts]);
            return chain;
          }),
          // Terminal: text-based searches use limit()
          limit: vi.fn(async () => {
            if (record.textSearch !== null) return state.ftResult;
            return state.ilikeResult;
          }),
          // Terminal: browse mode uses range()
          range: vi.fn(async () => {
            record.isRange = true;
            return state.browseResult;
          }),
        };
        return chain;
      }

      return {};
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Import route handler (after mocks are in place)
// ---------------------------------------------------------------------------

import { GET } from "@/app/api/search/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost/api/search");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

const MOCK_LISTING = {
  id: "listing-1",
  title: "Sea View Villa",
  price: 620000,
  is_promoted: false,
  categories: { name: "Property", slug: "property", icon: "🏠" },
  locations: { name: "Paphos", slug: "paphos" },
};

const MOCK_VECTOR_ROW = {
  id: "listing-2",
  title: "Penthouse",
  price: 500000,
  is_promoted: true,
  category_name: "Property",
  category_slug: "property",
  category_icon: "🏠",
  location_name: "Limassol",
  location_slug: "limassol",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Reset state to clean defaults
  state.embedResult = null;
  state.rpcResult = { data: null, error: null };
  state.rpcArgs = null;
  state.ftResult = { data: [MOCK_LISTING], error: null };
  state.ilikeResult = { data: [MOCK_LISTING], error: null };
  state.browseResult = { data: [MOCK_LISTING], count: 1, error: null };
  state.categoryLookup = { data: { id: "cat-prop-id" }, error: null };
  state.subcategoryLookup = { data: { id: "sub-apt-id" }, error: null };
  state.locationLookup = { data: { id: "loc-nic-id" }, error: null };
  state.listingsChains = [];

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/search", () => {
  // ── Slug → ID resolution ─────────────────────────────────────────────────

  describe("slug resolution", () => {
    it("resolves category slug to an id before querying listings", async () => {
      await GET(makeRequest({ q: "sea", category: "property" }));
      // The first listings chain should have category_id eq
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["category_id", "cat-prop-id"]);
    });

    it("does NOT add category_id filter when no category slug is provided", async () => {
      await GET(makeRequest({ q: "sea" }));
      const chain = state.listingsChains[0];
      const categoryEq = chain.eqs.find(([col]) => col === "category_id");
      expect(categoryEq).toBeUndefined();
    });

    it("does NOT add category_id filter when slug is not found in DB", async () => {
      state.categoryLookup = { data: null, error: { message: "not found" } };
      await GET(makeRequest({ q: "sea", category: "nonexistent" }));
      const chain = state.listingsChains[0];
      const categoryEq = chain.eqs.find(([col]) => col === "category_id");
      expect(categoryEq).toBeUndefined();
    });

    it("resolves subcategory slug to an id in browse mode", async () => {
      await GET(makeRequest({ category: "property", subcategory: "apartments" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["subcategory_id", "sub-apt-id"]);
    });

    it("resolves location slug to an id in browse mode", async () => {
      await GET(makeRequest({ location: "nicosia" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["location_id", "loc-nic-id"]);
    });
  });

  // ── Vector / semantic search path ────────────────────────────────────────

  describe("vector search (semantic)", () => {
    it("calls match_listings RPC when an embedding is returned", async () => {
      state.embedResult = [0.1, 0.2, 0.3];
      state.rpcResult = { data: [MOCK_VECTOR_ROW], error: null };
      const res = await GET(makeRequest({ q: "sea" }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.source).toBe("vector");
    });

    it("passes the query embedding and filters to match_listings", async () => {
      state.embedResult = [0.1, 0.2, 0.3];
      state.rpcResult = { data: [MOCK_VECTOR_ROW], error: null };
      await GET(makeRequest({ q: "villa", category: "property", location: "paphos", priceMin: "100000", priceMax: "900000" }));
      expect(state.rpcArgs).toMatchObject({
        filter_category: "property",
        filter_location: "paphos",
        filter_price_min: 100000,
        filter_price_max: 900000,
      });
    });

    it("reshapes vector rows so category is a nested object", async () => {
      state.embedResult = [0.1, 0.2, 0.3];
      state.rpcResult = { data: [MOCK_VECTOR_ROW], error: null };
      const res = await GET(makeRequest({ q: "penthouse" }));
      const { hits } = await res.json();
      expect(hits[0].category).toEqual({ name: "Property", slug: "property", icon: "🏠" });
      expect(hits[0].location).toEqual({ name: "Limassol", slug: "limassol" });
    });

    it("sorts promoted listings first in vector results", async () => {
      const promoted = { ...MOCK_VECTOR_ROW, id: "a", is_promoted: true };
      const normal   = { ...MOCK_VECTOR_ROW, id: "b", is_promoted: false };
      state.embedResult = [0.1];
      state.rpcResult = { data: [normal, promoted], error: null };
      const res = await GET(makeRequest({ q: "sea" }));
      const { hits } = await res.json();
      expect(hits[0].id).toBe("a");
      expect(hits[1].id).toBe("b");
    });

    it("falls through to full-text when RPC returns empty results", async () => {
      state.embedResult = [0.1, 0.2, 0.3];
      state.rpcResult = { data: [], error: null };
      const res = await GET(makeRequest({ q: "sea", category: "property" }));
      const body = await res.json();
      expect(body.source).toBe("fulltext");
    });

    it("falls through to full-text when RPC errors", async () => {
      state.embedResult = [0.1, 0.2, 0.3];
      state.rpcResult = { data: null, error: { message: "pgvector error" } };
      const res = await GET(makeRequest({ q: "sea" }));
      const body = await res.json();
      // Falls through to fulltext (ft returns mock data)
      expect(body.source).toBe("fulltext");
    });
  });

  // ── Full-text search path ─────────────────────────────────────────────────

  describe("full-text search fallback", () => {
    it("uses textSearch on the search_vector column", async () => {
      await GET(makeRequest({ q: "sea villa" }));
      const chain = state.listingsChains[0];
      expect(chain.textSearch).toBe("sea villa");
    });

    it("filters by category_id in full-text query", async () => {
      await GET(makeRequest({ q: "villa", category: "property" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["category_id", "cat-prop-id"]);
    });

    it("filters by location_id in full-text query", async () => {
      await GET(makeRequest({ q: "villa", location: "nicosia" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["location_id", "loc-nic-id"]);
    });

    it("filters by subcategory_id in full-text query", async () => {
      await GET(makeRequest({ q: "studio", subcategory: "apartments" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["subcategory_id", "sub-apt-id"]);
    });

    it("applies priceMin and priceMax in full-text query", async () => {
      await GET(makeRequest({ q: "villa", priceMin: "50000", priceMax: "700000" }));
      const chain = state.listingsChains[0];
      expect(chain.gtes).toContainEqual(["price", 50000]);
      expect(chain.ltes).toContainEqual(["price", 700000]);
    });

    it("returns source: fulltext when full-text finds results", async () => {
      const res = await GET(makeRequest({ q: "sea" }));
      const body = await res.json();
      expect(body.source).toBe("fulltext");
    });

    it("returns the hits array from full-text results", async () => {
      const res = await GET(makeRequest({ q: "sea" }));
      const { hits } = await res.json();
      expect(hits).toHaveLength(1);
      expect(hits[0].id).toBe("listing-1");
    });
  });

  // ── ilike fallback path ───────────────────────────────────────────────────

  describe("ilike fallback (when full-text returns nothing)", () => {
    beforeEach(() => {
      // Make full-text return empty to force ilike
      state.ftResult = { data: [], error: null };
    });

    it("runs an ilike query when full-text returns no results", async () => {
      await GET(makeRequest({ q: "sea" }));
      // Two from("listings") calls: one for FT, one for ilike
      expect(state.listingsChains).toHaveLength(2);
      const ilikeChain = state.listingsChains[1];
      expect(ilikeChain.ors.length).toBeGreaterThan(0);
      expect(ilikeChain.ors[0]).toContain("title.ilike");
    });

    it("filters by category_id in the ilike fallback — fixes the main bug", async () => {
      await GET(makeRequest({ q: "sea", category: "property" }));
      const ilikeChain = state.listingsChains[1];
      expect(ilikeChain.eqs).toContainEqual(["category_id", "cat-prop-id"]);
    });

    it("filters by location_id in the ilike fallback", async () => {
      await GET(makeRequest({ q: "sea", location: "nicosia" }));
      const ilikeChain = state.listingsChains[1];
      expect(ilikeChain.eqs).toContainEqual(["location_id", "loc-nic-id"]);
    });

    it("filters by subcategory_id in the ilike fallback", async () => {
      await GET(makeRequest({ q: "sea", subcategory: "apartments" }));
      const ilikeChain = state.listingsChains[1];
      expect(ilikeChain.eqs).toContainEqual(["subcategory_id", "sub-apt-id"]);
    });

    it("applies priceMin and priceMax in the ilike fallback", async () => {
      await GET(makeRequest({ q: "sea", priceMin: "200000", priceMax: "800000" }));
      const ilikeChain = state.listingsChains[1];
      expect(ilikeChain.gtes).toContainEqual(["price", 200000]);
      expect(ilikeChain.ltes).toContainEqual(["price", 800000]);
    });

    it("returns source: ilike", async () => {
      const res = await GET(makeRequest({ q: "sea" }));
      const body = await res.json();
      expect(body.source).toBe("ilike");
    });

    it("does NOT add category filter when no category is specified", async () => {
      await GET(makeRequest({ q: "sea" }));
      const ilikeChain = state.listingsChains[1];
      const categoryEq = ilikeChain.eqs.find(([col]) => col === "category_id");
      expect(categoryEq).toBeUndefined();
    });
  });

  // ── Browse / filter-only mode ─────────────────────────────────────────────

  describe("browse mode (no query)", () => {
    it("uses range() for pagination, not limit()", async () => {
      await GET(makeRequest({ category: "property" }));
      const chain = state.listingsChains[0];
      expect(chain.isRange).toBe(true);
    });

    it("filters by category_id when a category slug is provided", async () => {
      await GET(makeRequest({ category: "property" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["category_id", "cat-prop-id"]);
    });

    it("filters by subcategory_id when a subcategory slug is provided", async () => {
      await GET(makeRequest({ category: "property", subcategory: "apartments" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["subcategory_id", "sub-apt-id"]);
    });

    it("filters by location_id when a location slug is provided", async () => {
      await GET(makeRequest({ location: "nicosia" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["location_id", "loc-nic-id"]);
    });

    it("filters by priceMin and priceMax", async () => {
      await GET(makeRequest({ priceMin: "10000", priceMax: "50000" }));
      const chain = state.listingsChains[0];
      expect(chain.gtes).toContainEqual(["price", 10000]);
      expect(chain.ltes).toContainEqual(["price", 50000]);
    });

    it("applies no category/location filters when none are specified", async () => {
      await GET(makeRequest({}));
      const chain = state.listingsChains[0];
      const catEq = chain.eqs.find(([col]) => col === "category_id");
      const locEq = chain.eqs.find(([col]) => col === "location_id");
      expect(catEq).toBeUndefined();
      expect(locEq).toBeUndefined();
    });

    it("returns source: browse", async () => {
      const res = await GET(makeRequest({}));
      const body = await res.json();
      expect(body.source).toBe("browse");
    });

    it("returns totalHits from the DB count", async () => {
      state.browseResult = { data: [MOCK_LISTING], count: 42, error: null };
      const res = await GET(makeRequest({}));
      const body = await res.json();
      expect(body.totalHits).toBe(42);
    });

    it("orders by is_promoted desc first to float promoted listings", async () => {
      await GET(makeRequest({}));
      const chain = state.listingsChains[0];
      expect(chain.orders[0]).toContainEqual("is_promoted");
    });

    it("returns 500 when Supabase returns an error in browse mode", async () => {
      state.browseResult = { data: null, count: 0, error: { message: "DB error" } };
      const res = await GET(makeRequest({}));
      expect(res.status).toBe(500);
    });
  });

  // ── Cross-cutting: always filter by status = active ──────────────────────

  describe("status filter", () => {
    it("always filters listings by status=active in full-text search", async () => {
      await GET(makeRequest({ q: "sea" }));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["status", "active"]);
    });

    it("always filters listings by status=active in browse mode", async () => {
      await GET(makeRequest({}));
      const chain = state.listingsChains[0];
      expect(chain.eqs).toContainEqual(["status", "active"]);
    });

    it("always filters listings by status=active in ilike fallback", async () => {
      state.ftResult = { data: [], error: null };
      await GET(makeRequest({ q: "sea" }));
      const ilikeChain = state.listingsChains[1];
      expect(ilikeChain.eqs).toContainEqual(["status", "active"]);
    });
  });
});
