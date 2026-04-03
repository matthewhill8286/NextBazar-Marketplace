/**
 * Application-wide constants.
 * Import from here instead of scattering magic values across files.
 */

// ─── Listings ─────────────────────────────────────────────────────────────────

/** Fallback image shown on listing cards when no photo has been uploaded. */
export const FALLBACK_LISTING_IMAGE =
  "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop";

/** Number of days a listing stays active before expiry. */
export const LISTING_ACTIVE_DAYS = 30;

/** Milliseconds equivalent of LISTING_ACTIVE_DAYS. */
export const LISTING_ACTIVE_MS = LISTING_ACTIVE_DAYS * 24 * 60 * 60 * 1000;

// ─── Search / pagination ──────────────────────────────────────────────────────

/** Default number of listings per page on the search page. */
export const SEARCH_PAGE_SIZE = 24;

/** localStorage key for persisting the last-used location slug. */
export const LAST_SEARCH_LOCATION_KEY = "lastSearchLocation";
