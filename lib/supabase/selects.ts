// ─── Shared select fragments ─────────────────────────────────────────────────
// Pure string constants — safe to import from both server and client components.

/** Select fragment for listing card data (home, search, profile, related).
 *  Explicit columns — excludes heavy `embedding` and `search_vector`. */
export const CARD_SELECT = `
  id, user_id, category_id, location_id,
  title, slug, price, currency, price_type, condition, status,
  primary_image_url, is_promoted, is_urgent,
  view_count, favorite_count, created_at,
  categories(name, slug, icon),
  locations(name, slug),
  profiles!listings_user_id_fkey(display_name, avatar_url, verified, rating, total_reviews, is_dealer)
`;
