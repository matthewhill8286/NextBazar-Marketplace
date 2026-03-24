/**
 * Shared domain types derived from the generated Database schema.
 *
 * Import these instead of `any` whenever you work with Supabase data in
 * components, server actions, or cached queries.
 */
import type { Tables } from "./database.types";

// ─── Simple row types ─────────────────────────────────────────────────────────

export type Category = Tables<"categories">;

/** Subcategory as returned by the cached query (id, category_id, name, slug, sort_order). */
export type Subcategory = Pick<
  Tables<"subcategories">,
  "id" | "category_id" | "name" | "slug" | "sort_order"
>;

/** Location as returned by the cached query (id, name, slug). */
export type Location = Pick<Tables<"locations">, "id" | "name" | "slug">;

// ─── Relation join sub-shapes ─────────────────────────────────────────────────

/** categories(name, slug, icon) join — used in CARD_SELECT and LISTING_DETAIL_SELECT */
export type CategoryJoin = Pick<Tables<"categories">, "name" | "slug" | "icon">;

/** subcategories(name, slug) join — used in LISTING_DETAIL_SELECT */
export type SubcategoryJoin = Pick<Tables<"subcategories">, "name" | "slug">;

/** locations(name, slug) join — used in CARD_SELECT and LISTING_DETAIL_SELECT */
export type LocationJoin = Pick<Tables<"locations">, "name" | "slug">;

/** profiles join shape used in listing card queries */
export type CardProfileJoin = Pick<
  Tables<"profiles">,
  "display_name" | "avatar_url" | "verified" | "rating" | "total_reviews" | "is_dealer"
>;

/** profiles join shape used in listing detail queries (fuller set of fields) */
export type DetailProfileJoin = Pick<
  Tables<"profiles">,
  | "id"
  | "display_name"
  | "avatar_url"
  | "verified"
  | "rating"
  | "total_reviews"
  | "is_dealer"
  | "created_at"
  | "whatsapp_number"
  | "telegram_username"
>;

/** listing_images join shape used in listing detail queries */
export type ListingImageJoin = Pick<
  Tables<"listing_images">,
  "id" | "url" | "thumbnail_url" | "sort_order"
>;

// ─── Composite listing types ──────────────────────────────────────────────────

/** Columns returned by CARD_SELECT (excludes heavy embedding / search_vector). */
type ListingCardColumns = Pick<
  Tables<"listings">,
  | "id" | "user_id" | "category_id" | "location_id"
  | "title" | "slug" | "price" | "currency" | "price_type" | "condition" | "status"
  | "primary_image_url" | "is_promoted" | "is_urgent"
  | "view_count" | "favorite_count" | "created_at"
>;

/**
 * Listing row as returned by CARD_SELECT.
 * Used on the home page, search page, and related listings.
 */
export type ListingCardRow = ListingCardColumns & {
  categories: CategoryJoin | null;
  locations: LocationJoin | null;
  profiles: CardProfileJoin | null;
};

/** Columns returned by LISTING_DETAIL_SELECT (excludes embedding / search_vector). */
type ListingDetailColumns = Pick<
  Tables<"listings">,
  | "id" | "user_id" | "category_id" | "subcategory_id" | "location_id"
  | "title" | "slug" | "description" | "price" | "currency" | "price_type"
  | "condition" | "status" | "primary_image_url" | "image_count" | "video_url"
  | "is_promoted" | "promoted_until" | "is_urgent"
  | "view_count" | "favorite_count" | "message_count"
  | "contact_phone" | "attributes"
  | "expires_at" | "created_at" | "updated_at"
>;

/**
 * Listing row as returned by LISTING_DETAIL_SELECT.
 * Used on the listing detail page.
 */
export type ListingDetailRow = ListingDetailColumns & {
  categories: CategoryJoin | null;
  subcategories: SubcategoryJoin | null;
  locations: LocationJoin | null;
  profiles: DetailProfileJoin | null;
  listing_images: ListingImageJoin[] | null;
};

/**
 * Flexible listing shape used on the search page.
 *
 * Deliberately does NOT extend the full `Tables<"listings">` row because the
 * vector-search API returns only a subset of columns.  Only the fields consumed
 * by `ListingCard` are required; everything else is optional.
 *
 * Covers both:
 *  - Supabase direct queries using `categories` / `locations` key names
 *  - The `/api/search` vector route whose results are normalised to
 *    `category` / `location` by the `normalise()` helper in search-client.tsx
 */
export type SearchListing = {
  // ── Required by ListingCard ───────────────────────────────────────────────
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  primary_image_url: string | null;
  is_promoted: boolean;
  is_urgent: boolean;
  condition: string | null;
  view_count: number;
  created_at: string;
  status?: string | null;
  // ── Relation joins — different paths use different key names ──────────────
  categories?: CategoryJoin | null;
  locations?: LocationJoin | null;
  profiles?: CardProfileJoin | null;
  /** Present after normalise() on API / vector search results */
  category?: CategoryJoin | null;
  /** Present after normalise() on API / vector search results */
  location?: LocationJoin | null;
  // Allow full listing rows (from filter-only searches) to be assigned too
  [key: string]: unknown;
};

// ─── Dashboard listing type ───────────────────────────────────────────────────

/**
 * Listing row used in dashboard listing management, analytics, and profile pages.
 * Joins categories and locations as either a single object or array (Supabase
 * returns arrays for one-to-many selects, single objects for foreign-key selects).
 */
export type DashboardListing = Pick<
  Tables<"listings">,
  | "id"
  | "title"
  | "slug"
  | "price"
  | "currency"
  | "price_type"
  | "condition"
  | "status"
  | "primary_image_url"
  | "view_count"
  | "favorite_count"
  | "is_promoted"
  | "is_urgent"
  | "created_at"
  | "expires_at"
  | "category_id"
  | "location_id"
> & {
  message_count: number;
  categories:
    | Pick<Tables<"categories">, "name" | "slug" | "icon">
    | Pick<Tables<"categories">, "name" | "slug" | "icon">[]
    | null;
  locations:
    | Pick<Tables<"locations">, "name">
    | Pick<Tables<"locations">, "name">[]
    | null;
};
