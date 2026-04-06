import { type NextRequest, NextResponse } from "next/server";
import { getPlanLimits } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

/**
 * POST /api/dealer/import-csv
 *
 * Accepts a JSON body with an array of parsed listing rows from the client.
 * Validates each row, inserts them in bulk, and returns results.
 * Optionally downloads images from provided URLs and attaches them.
 *
 * Only available to authenticated Pro Sellers.
 */

type ImportRow = {
  title: string;
  description?: string;
  price?: number | null;
  price_type?: string;
  condition?: string;
  category_slug?: string;
  subcategory_slug?: string;
  location_slug?: string;
  contact_phone?: string;
  image_url?: string;
  attributes?: Record<string, string>;
  quantity?: number;
  low_stock_threshold?: number;
};

type InsertResult = {
  row: number;
  status: "created" | "error";
  title: string;
  slug?: string;
  error?: string;
};

/**
 * Download an image from a URL and upload it to Supabase storage.
 * Returns the public URL or null on failure.
 */
async function downloadAndUploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  imageUrl: string,
  userId: string,
  listingId: string,
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    // Determine extension from content type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = extMap[contentType] || "jpg";
    const filePath = `listings/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listings")
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) return null;

    const { data: urlData } = supabase.storage
      .from("listings")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { userId } = auth;

    const supabase = await createClient();
    // Verify Business tier (CSV import is Business-only)
    const { data: shop } = await supabase
      .from("dealer_shops")
      .select("plan_tier, plan_status")
      .eq("user_id", userId)
      .single();

    const limits = getPlanLimits(shop?.plan_tier ?? "starter");

    if (!shop || shop.plan_status !== "active" || !limits.csvImport) {
      return NextResponse.json(
        { error: "CSV import requires a Business plan" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const rows: ImportRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    if (rows.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 listings per import" },
        { status: 400 },
      );
    }

    // Fetch reference data for slug → id resolution
    const [{ data: categories }, { data: subcategories }, { data: locations }] =
      await Promise.all([
        supabase.from("categories").select("id, slug"),
        supabase.from("subcategories").select("id, slug, category_id"),
        supabase.from("locations").select("id, slug, name"),
      ]);

    const catMap = new Map(
      (categories ?? []).map((c) => [c.slug.toLowerCase(), c.id]),
    );
    const subMap = new Map(
      (subcategories ?? []).map((s) => [s.slug.toLowerCase(), s]),
    );
    const locMap = new Map(
      (locations ?? []).map((l) => [l.slug.toLowerCase(), l.id]),
    );
    // Also allow matching by location name
    const locNameMap = new Map(
      (locations ?? []).map((l) => [l.name.toLowerCase(), l.id]),
    );

    const results: InsertResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Validate required fields
      if (!row.title || row.title.trim().length < 3) {
        results.push({
          row: i + 1,
          status: "error",
          title: row.title || "(empty)",
          error: "Title is required (min 3 characters)",
        });
        continue;
      }

      // Resolve category
      const catSlug = (row.category_slug ?? "").toLowerCase().trim();
      const categoryId = catMap.get(catSlug);
      if (!categoryId) {
        results.push({
          row: i + 1,
          status: "error",
          title: row.title,
          error: `Unknown category: "${row.category_slug}"`,
        });
        continue;
      }

      // Resolve subcategory (optional — NULL allowed)
      let subcategoryId: string | null = null;
      if (row.subcategory_slug) {
        const subSlug = row.subcategory_slug.toLowerCase().trim();
        const sub = subMap.get(subSlug);
        if (sub && sub.category_id === categoryId) {
          subcategoryId = sub.id;
        }
      }

      // Resolve location (optional — try slug first, then name)
      let locationId: string | null = null;
      if (row.location_slug) {
        const locKey = row.location_slug.toLowerCase().trim();
        locationId = locMap.get(locKey) ?? locNameMap.get(locKey) ?? null;
      }

      // Build insert payload
      const insertPayload = {
        user_id: userId,
        title: row.title.trim(),
        slug: "", // auto-generated by DB trigger
        description: row.description?.trim() || null,
        price:
          row.price !== undefined && row.price !== null
            ? Number(row.price)
            : null,
        price_type: row.price_type || "fixed",
        condition: row.condition || null,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        location_id: locationId,
        contact_phone: row.contact_phone || null,
        status: "draft" as const,
        ...(row.attributes &&
        Object.values(row.attributes).some((v) => v?.trim())
          ? { attributes: row.attributes }
          : {}),
        ...(row.quantity != null ? { quantity: row.quantity } : {}),
        ...(row.low_stock_threshold != null
          ? { low_stock_threshold: row.low_stock_threshold }
          : {}),
      };

      const { data, error } = await supabase
        .from("listings")
        .insert(insertPayload)
        .select("id, slug")
        .single();

      if (error) {
        results.push({
          row: i + 1,
          status: "error",
          title: row.title,
          error: error.message,
        });
        continue;
      }

      // Download and attach image if URL provided
      if (row.image_url?.trim()) {
        const imagePublicUrl = await downloadAndUploadImage(
          supabase,
          row.image_url.trim(),
          userId,
          data.id,
        );

        if (imagePublicUrl) {
          // Update listing with primary image
          await supabase
            .from("listings")
            .update({
              primary_image_url: imagePublicUrl,
              image_count: 1,
            })
            .eq("id", data.id);

          // Insert into listing_images
          await supabase.from("listing_images").insert({
            listing_id: data.id,
            url: imagePublicUrl,
            sort_order: 0,
          });
        }
      }

      results.push({
        row: i + 1,
        status: "created",
        title: row.title,
        slug: data.slug,
      });
    }

    const created = results.filter((r) => r.status === "created").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      summary: { total: rows.length, created, errors },
      results,
    });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
