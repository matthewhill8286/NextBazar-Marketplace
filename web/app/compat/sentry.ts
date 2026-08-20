export function captureException(error: unknown) {
  console.error(error);
}

export function init() {}

const Sentry = { captureException, init };
export default Sentry;
