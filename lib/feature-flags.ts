/**
 * Feature flags — flip a flag to `true` to enable the feature in production.
 * Keep flags here rather than scattered across components so they're easy to
 * find, review, and remove once a feature ships.
 */

export const FEATURE_FLAGS = {
  /** Language / locale switcher in the user dropdown. Not yet ready for release. */
  LANGUAGE_SWITCHER: false,

  /** Crypto payments via Coinbase Commerce. Flip to true once API keys are configured. */
  CRYPTO_PAYMENTS: false,

  /** For Dealers landing page + footer link. Hidden until dealer billing is ready. */
  DEALERS_PAGE: false,

  /** Dealer / Shops features — shops page, dealer badges, dashboard dealer portal, homepage featured shops. */
  DEALERS: false,

  /** Reports queue & dashboard — hide until full CRUD reports management is built. */
  REPORTS: false,
} as const;
