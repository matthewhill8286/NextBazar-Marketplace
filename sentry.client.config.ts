import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring — sample 10% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay intentionally omitted. @sentry/replay is ~50 KB gzip
    // and was the single largest line item in the client bundle. The
    // previous 1% / 100%-on-error sampling was costing every visitor that
    // payload for a tiny fraction of actually-captured sessions. Turn this
    // back on only if/when Replay becomes a load-bearing debugging tool.
    //
    // replaysSessionSampleRate: 0.01,
    // replaysOnErrorSampleRate: 1.0,

    integrations: [Sentry.browserTracingIntegration()],

    // Filter out noise
    ignoreErrors: [
      // Browser extensions
      "ResizeObserver loop",
      "Non-Error exception captured",
      // Network failures users can't control
      "Failed to fetch",
      "Load failed",
      "NetworkError",
    ],
  });
}
