/**
 * Feature flags — flip a flag to `true` to enable the feature in production.
 * Keep flags here rather than scattered across components so they're easy to
 * find, review, and remove once a feature ships.
 */

export const FEATURE_FLAGS = {
  /** Language / locale switcher in the user dropdown. Not yet ready for release. */
  LANGUAGE_SWITCHER: false,
} as const;
