import "../instrument.server.mjs";
import { createReadableStreamFromReadable } from "@react-router/node";
import * as Sentry from "@sentry/react-router";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";

export const streamTimeout = 5_000;

const handleRequest = Sentry.createSentryHandleRequest({
  ServerRouter,
  renderToPipeableStream,
  createReadableStreamFromReadable,
  streamTimeout,
});

export default handleRequest;

export const handleError = Sentry.createSentryHandleError({
  logErrors: true,
});

export const instrumentations = [Sentry.createSentryServerInstrumentation()];
