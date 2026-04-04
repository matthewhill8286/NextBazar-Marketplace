const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  cacheLife: {
    /** Reference data: categories, locations, subcategories (revalidate hourly) */
    reference: {
      stale: 300, // 5 min client
      revalidate: 3600, // 1 hour server
      expire: 86400, // 1 day
    },
    /** Listing feeds: featured, recent, related (revalidate every minute) */
    listings: {
      stale: 60, // 1 min client
      revalidate: 60, // 1 min server
      expire: 3600, // 1 hour
    },
    /** Pricing table (revalidate every 5 min) */
    pricing: {
      stale: 60, // 1 min client
      revalidate: 300, // 5 min server
      expire: 3600, // 1 hour
    },
  },
  images: {
    loader: "custom",
    loaderFile: "./lib/supabase/image-loader.ts",
  },
};

module.exports = withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  // Suppresses source map upload logs during build
  silent: true,
  // Upload source maps only when SENTRY_AUTH_TOKEN is available
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only enable source map uploads for production builds with the token
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  // Hides source maps from users
  hideSourceMaps: true,
  // Tree-shake Sentry logger statements to reduce bundle size
  webpack: {
    treeshakeRemoveLogs: true,
  },
});
