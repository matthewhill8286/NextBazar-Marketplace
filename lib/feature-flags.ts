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
} as const;
