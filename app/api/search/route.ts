import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embed } from "@/lib/embeddings";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const q           = sp.get("q")?.trim() || "";
  const category    = sp.get("category") || "";
  const subcategory = sp.get("subcategory") || "";
  const location    = sp.get("location") || "";
  const sort        = sp.get("sort") || "newest";
  const priceMin    = sp.get("priceMin");
  const priceMax    = sp.get("priceMax");
  const limit       = Math.min(48, Number(sp.get("limit") || "24"));

  const supabase = getSupabase();

  // ── Semantic search (query provided) ──────────────────────────────────────
  if (q) {
    const embedding = await embed(q);

    if (embedding) {
      const { data, error } = await supabase.rpc("match_listings", {
        query_embedding:  embedding,
        match_count:      limit,
        filter_category:  category  || null,
        filter_location:  location  || null,
        filter_price_min: priceMin  ? Number(priceMin)  : null,
        filter_price_max: priceMax  ? Number(priceMax)  : null,
      });

      if (!error && data && data.length > 0) {
        const hits = data.map((r: any) => ({
          ...r,
          category: r.category_name
            ? { name: r.category_name, slug: r.category_slug, icon: r.category_icon }
            : null,
          location: r.location_name
            ? { name: r.location_name, slug: r.location_slug }
            : null,
        }));
        return NextResponse.json({ hits, totalHits: hits.length, source: "vector" });
      }
      // Fall through to full-text if vector search returns nothing
    }

    // ── Full-text fallback ───────────────────────────────────────────────────
    let ftq = supabase
      .from("listings")
      .select(`*, categories(name, slug, icon), locations(name, slug)`)
      .eq("status", "active")
      .textSearch("search_vector", q, { type: "websearch", config: "english" });

    if (category)  ftq = ftq.eq("category_slug_ref", category);   // filtered below
    if (location)  ftq = ftq.eq("location_slug_ref", location);
    if (priceMin)  ftq = ftq.gte("price", Number(priceMin));
    if (priceMax)  ftq = ftq.lte("price", Number(priceMax));

    const { data: ftData } = await ftq.order("created_at", { ascending: false }).limit(limit);

    // ilike fallback if full-text returns nothing
    if (!ftData || ftData.length === 0) {
      let ilikeQ = supabase
        .from("listings")
        .select(`*, categories(name, slug, icon), locations(name, slug)`)
        .eq("status", "active")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`);

      if (priceMin) ilikeQ = ilikeQ.gte("price", Number(priceMin));
      if (priceMax) ilikeQ = ilikeQ.lte("price", Number(priceMax));

      const { data: ilikeData } = await ilikeQ
        .order("created_at", { ascending: false })
        .limit(limit);

      const hits = ilikeData || [];
      return NextResponse.json({ hits, totalHits: hits.length, source: "ilike" });
    }

    return NextResponse.json({ hits: ftData, totalHits: ftData.length, source: "fulltext" });
  }

  // ── Browse / filter-only mode (no query) ──────────────────────────────────
  let browseQ = supabase
    .from("listings")
    .select(`*, categories(name, slug, icon), locations(name, slug)`)
    .eq("status", "active");

  // Apply filters via joined table slug lookups
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();
    if (cat) browseQ = browseQ.eq("category_id", cat.id);
  }
  if (subcategory) {
    const { data: sub } = await supabase
      .from("subcategories")
      .select("id")
      .eq("slug", subcategory)
      .single();
    if (sub) browseQ = browseQ.eq("subcategory_id", sub.id);
  }
  if (location) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", location)
      .single();
    if (loc) browseQ = browseQ.eq("location_id", loc.id);
  }
  if (priceMin) browseQ = browseQ.gte("price", Number(priceMin));
  if (priceMax) browseQ = browseQ.lte("price", Number(priceMax));

  const sortMap: Record<string, { col: string; asc: boolean }> = {
    newest:     { col: "created_at", asc: false },
    oldest:     { col: "created_at", asc: true  },
    price_low:  { col: "price",      asc: true  },
    price_high: { col: "price",      asc: false },
    popular:    { col: "view_count", asc: false },
  };
  const s = sortMap[sort] ?? sortMap.newest;
  browseQ = browseQ.order(s.col, { ascending: s.asc });

  const { data, error } = await browseQ.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ hits: data || [], totalHits: (data || []).length, source: "browse" });
}
