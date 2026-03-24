// Shared select fragments – safe to import from both server and client code.

/** Select fragment for listing card data (home, search, profile, related). */
export const CARD_SELECT = `
  *,
  categories(name, slug, icon),
  locations(name, slug),
  profiles!listings_user_id_fkey(display_name, avatar_url, verified, rating, total_reviews)
`;
