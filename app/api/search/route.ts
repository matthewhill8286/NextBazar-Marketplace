import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/embeddings";

/** Short CDN + browser cache for search results (30s fresh, serve stale up to 5 min while revalidating) */
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * GET /api/search
 *
 * With a text query  → semantic pgvector search, falls back to full-text if no embeddings
 * Without a query    → standard Supabase filter query (browse/filter mode)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const q = sp.get("q")?.trim() || "";
  const category = sp.get("category") || "";
  const subcategory = sp.get("subcategory") || "";
  const location = sp.get("location") || "";
  const sort = sp.get("sort") || "newest";
  const priceMin = sp.get("priceMin");
  const priceMax = sp.get("priceMax");
  const limit = Math.min(48, Number(sp.get("limit") || "24"));
  const offset = Math.max(0, Number(sp.get("offset") || "0"));

  const supabase = getSupabase();

  // ── Resolve slugs → IDs once, reused by all query branches ───────────────
  let categoryId: string | null = null;
  let subcategoryId: string | null = null;
  let locationId: string | null = null;

  if (category) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    categoryId = data?.id ?? null;
  }
  if (subcategory) {
    const { data } = await supabase
      .from("subcategories")
      .select("id")
      .eq("slug", subcategory)
      .single();
    subcategoryId = data?.id ?? null;
  }
  if (location) {
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", location)
      .single();
    locationId = data?.id ?? null;
  }

  // ── Semantic search (query provided) ──────────────────────────────────────
  if (q) {
    const embedding = await embed(q);

    if (embedding) {
      const { data, error } = await supabase.rpc("match_listings", {
        query_embedding: embedding,
        match_count: limit,
        filter_category: category || null,
        filter_location: location || null,
        filter_price_min: priceMin ? Number(priceMin) : null,
        filter_price_max: priceMax ? Number(priceMax) : null,
      });

      if (!error && data && data.length > 0) {
        const hits = data.map((r: any) => ({
          ...r,
          category: r.category_name
            ? {
                name: r.category_name,
                slug: r.category_slug,
                icon: r.category_icon,
              }
            : null,
          location: r.location_name
            ? { name: r.location_name, slug: r.location_slug }
            : null,
        }));
        // 3-tier boost: featured (0) > urgent (1) > normal (2), then newest within each tier
        hits.sort((a: any, b: any) => {
          const tierA = a.is_promoted ? 0 : a.is_urgent ? 1 : 2;
          const tierB = b.is_promoted ? 0 : b.is_urgent ? 1 : 2;
          if (tierA !== tierB) return tierA - tierB;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
        return NextResponse.json(
          {
            hits,
            totalHits: hits.length,
            source: "vector",
          },
          { headers: CACHE_HEADERS },
        );
      }
      // Fall through to full-text if vector search returns nothing
    }

    // ── Full-text fallback ───────────────────────────────────────────────────
    let ftq = supabase
      .from("listings")
      .select(`*, categories(name, slug, icon), locations(name, slug)`)
      .eq("status", "active")
      .textSearch("search_vector", q, { type: "websearch", config: "english" });

    if (categoryId) ftq = ftq.eq("category_id", categoryId);
    if (subcategoryId) ftq = ftq.eq("subcategory_id", subcategoryId);
    if (locationId) ftq = ftq.eq("location_id", locationId);
    if (priceMin) ftq = ftq.gte("price", Number(priceMin));
    if (priceMax) ftq = ftq.lte("price", Number(priceMax));

    const { data: ftData } = await ftq
      .order("is_promoted", { ascending: false })
      .order("is_urgent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    // ilike fallback if full-text returns nothing
    if (!ftData || ftData.length === 0) {
      let ilikeQ = supabase
        .from("listings")
        .select(`*, categories(name, slug, icon), locations(name, slug)`)
        .eq("status", "active")
        .ilike("title", `%${q}%`);

      if (categoryId) ilikeQ = ilikeQ.eq("category_id", categoryId);
      if (subcategoryId) ilikeQ = ilikeQ.eq("subcategory_id", subcategoryId);
      if (locationId) ilikeQ = ilikeQ.eq("location_id", locationId);
      if (priceMin) ilikeQ = ilikeQ.gte("price", Number(priceMin));
      if (priceMax) ilikeQ = ilikeQ.lte("price", Number(priceMax));

      const { data: ilikeData } = await ilikeQ
        .order("is_promoted", { ascending: false })
        .order("is_urgent", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      const hits = ilikeData || [];
      return NextResponse.json(
        {
          hits,
          totalHits: hits.length,
          source: "ilike",
        },
        { headers: CACHE_HEADERS },
      );
    }

    return NextResponse.json(
      {
        hits: ftData,
        totalHits: ftData.length,
        source: "fulltext",
      },
      { headers: CACHE_HEADERS },
    );
  }

  // ── Browse / filter-only mode (no query) ──────────────────────────────────
  let browseQ = supabase
    .from("listings")
    .select(`*, categories(name, slug, icon), locations(name, slug)`, {
      count: "exact",
    })
    .eq("status", "active");

  if (categoryId) browseQ = browseQ.eq("category_id", categoryId);
  if (subcategoryId) browseQ = browseQ.eq("subcategory_id", subcategoryId);
  if (locationId) browseQ = browseQ.eq("location_id", locationId);
  if (priceMin) browseQ = browseQ.gte("price", Number(priceMin));
  if (priceMax) browseQ = browseQ.lte("price", Number(priceMax));

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    newest: { col: "created_at", asc: false },
    oldest: { col: "created_at", asc: true },
    price_low: { col: "price", asc: true },
    price_high: { col: "price", asc: false },
    popular: { col: "view_count", asc: false },
  };
  const s = sortMap[sort] ?? sortMap.newest;
  // 3-tier boost: featured → urgent → normal, then the user's chosen sort within each tier
  browseQ = browseQ
    .order("is_promoted", { ascending: false })
    .order("is_urgent", { ascending: false })
    .order(s.col, { ascending: s.asc });

  const { data, count, error } = await browseQ.range(
    offset,
    offset + limit - 1,
  );
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    {
      hits: data || [],
      totalHits: count ?? (data || []).length,
      source: "browse",
    },
    { headers: CACHE_HEADERS },
  );
}
