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

/** Number of days before expiry when we start showing the warning badge. */
export const EXPIRY_WARNING_DAYS = 7;

// ─── Search / pagination ──────────────────────────────────────────────────────

/** Default number of listings per page on the search page. */
export const SEARCH_PAGE_SIZE = 24;

/** localStorage key for persisting the last-used location slug. */
export const LAST_SEARCH_LOCATION_KEY = "lastSearchLocation";

// ─── Offers ───────────────────────────────────────────────────────────────────

/** Default number of days before an offer expires. */
export const DEFAULT_OFFER_EXPIRY_DAYS = 3;

// ─── Promotions ───────────────────────────────────────────────────────────────

/** Default promotion duration in days (used as fallback in Stripe webhook). */
export const DEFAULT_PROMOTION_DURATION_DAYS = 7;

// ─── UI ───────────────────────────────────────────────────────────────────────

/** Default location name shown on cards when location is unknown. */
export const DEFAULT_LOCATION_NAME = "Cyprus";
