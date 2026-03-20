import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { embed, listingToText } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYNC_SECRET = process.env.SYNC_SECRET;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * POST /api/embeddings/sync
 *
 * Two modes (both require x-sync-secret header):
 *
 * 1. Full backfill  — body: { mode: "full" }
 *    Generates embeddings for all active listings that don't have one yet.
 *    Processes in batches of 50 to stay within OpenAI rate limits.
 *
 * 2. Webhook (Supabase Database Webhook on listings INSERT/UPDATE)
 *    body: { type: "INSERT"|"UPDATE"|"DELETE", record: {...} }
 *    Generates or removes the embedding for the affected listing.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("x-sync-secret");
  if (SYNC_SECRET && authHeader !== SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabase();

  // ── Webhook mode ────────────────────────────────────────────────────────
  if (body.type && body.record) {
    const { type, record } = body;

    if (type === "DELETE" || record.status !== "active") {
      // Clear embedding on delete or when listing is no longer active
      await supabase
        .from("listings")
        .update({ embedding: null })
        .eq("id", record.id);
      return NextResponse.json({ cleared: record.id });
    }

    // Fetch joined data for better embedding text
    const { data: full } = await supabase
      .from("listings")
      .select(`title, description, condition, categories(name), locations(name)`)
      .eq("id", record.id)
      .single();

    if (!full) return NextResponse.json({ skipped: record.id });

    const cat = Array.isArray(full.categories) ? full.categories[0] : full.categories;
    const loc = Array.isArray(full.locations)  ? full.locations[0]  : full.locations;

    const text = listingToText({
      title:         full.title,
      description:   full.description,
      category_name: cat?.name,
      location_name: loc?.name,
      condition:     full.condition,
    });

    const embedding = await embed(text);
    if (!embedding) return NextResponse.json({ error: "embedding failed" }, { status: 500 });

    await supabase
      .from("listings")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", record.id);

    return NextResponse.json({ embedded: record.id });
  }

  // ── Full backfill mode ──────────────────────────────────────────────────
  const BATCH = 50;
  let offset = 0;
  let totalEmbedded = 0;
  let totalSkipped = 0;

  while (true) {
    const { data, error } = await supabase
      .from("listings")
      .select(`id, title, description, condition, categories(name), locations(name)`)
      .eq("status", "active")
      .is("embedding", null)          // only listings without an embedding yet
      .range(offset, offset + BATCH - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    for (const listing of data) {
      const cat = Array.isArray(listing.categories) ? listing.categories[0] : listing.categories;
      const loc = Array.isArray(listing.locations)  ? listing.locations[0]  : listing.locations;

      const text = listingToText({
        title:         listing.title,
        description:   listing.description,
        category_name: (cat as any)?.name,
        location_name: (loc as any)?.name,
        condition:     listing.condition,
      });

      const embedding = await embed(text);
      if (!embedding) { totalSkipped++; continue; }

      await supabase
        .from("listings")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", listing.id);

      totalEmbedded++;
    }

    if (data.length < BATCH) break;
    offset += BATCH;
  }

  return NextResponse.json({ embedded: totalEmbedded, skipped: totalSkipped });
}
