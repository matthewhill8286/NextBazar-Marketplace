import "../instrument.server.mjs";
import * as Sentry from "@sentry/react-router";
import { handleRequest } from "@vercel/react-router/entry.server";
import type { AppLoadContext, EntryContext } from "react-router";

export { streamTimeout } from "@vercel/react-router/entry.server";

export default Sentry.wrapSentryHandleRequest(
  (
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    routerContext: EntryContext,
    loadContext: AppLoadContext,
  ) =>
    handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      routerContext,
      loadContext,
    ),
);

export const handleError = Sentry.createSentryHandleError({
  logErrors: true,
});

export const instrumentations = [Sentry.createSentryServerInstrumentation()];
