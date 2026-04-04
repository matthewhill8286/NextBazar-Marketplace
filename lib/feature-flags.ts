/**
 * Feature flags — flip a flag to `true` to enable the feature in production.
 * Keep flags here rather than scattered across components so they're easy to
 * find, review, and remove once a feature ships.
 */

export const FEATURE_FLAGS = {
  /** Language / locale switcher in the user dropdown. */
  LANGUAGE_SWITCHER: true,

  /** Crypto payments via Coinbase Commerce. Flip to true once API keys are configured. */
  CRYPTO_PAYMENTS: false,

  /** For Dealers landing page + footer link. Hidden until dealer billing is ready. */
  DEALERS_PAGE: true,

  /** Dealer / Shops features — shops page, dealer badges, dashboard dealer portal, homepage featured shops. */
  DEALERS: true,

  /** Reports queue & dashboard — hide until full CRUD reports management is built. */
  REPORTS: false,

  /**
   * Soft-launch category filter — when enabled, only the categories whose
   * slugs are listed in SOFT_LAUNCH_CATEGORY_SLUGS will be shown across the
   * site (homepage grid, search sidebar, post form, onboarding, etc.).
   *
   * Flip to `false` when you're ready to open all categories.
   */
  SOFT_LAUNCH_CATEGORIES: true,
} as const;

/**
 * Category slugs visible during the soft-launch phase.
 * Only meaningful when FEATURE_FLAGS.SOFT_LAUNCH_CATEGORIES is `true`.
 */
export const SOFT_LAUNCH_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  "vehicles",
  "property",
]);
