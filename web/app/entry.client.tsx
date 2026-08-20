import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const dsn = import.meta.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.reactRouterTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    ignoreErrors: [
      "ResizeObserver loop",
      "Non-Error exception captured",
      "Failed to fetch",
      "Load failed",
      "NetworkError",
    ],
    tracePropagationTargets: [/^\//],
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        instrumentations={[Sentry.createSentryClientInstrumentation()]}
        onError={Sentry.sentryOnError}
      />
    </StrictMode>,
  );
});
