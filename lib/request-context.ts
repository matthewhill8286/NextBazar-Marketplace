import { AsyncLocalStorage } from "node:async_hooks";

type RequestStore = {
  request: Request;
  responseHeaders: Headers;
  userId: string | null;
};

const storage = new AsyncLocalStorage<RequestStore>();

export function runWithRequestContext<T>(
  request: Request,
  fn: () => T,
  init?: { userId?: string | null },
): T {
  const store: RequestStore = {
    request,
    responseHeaders: new Headers(),
    userId: init?.userId ?? null,
  };
  return storage.run(store, fn);
}

export function getRequestStore(): RequestStore {
  const store = storage.getStore();
  if (!store) {
    throw new Error(
      "No request context. Wrap loaders/actions with runWithRequestContext().",
    );
  }
  return store;
}

export function tryGetRequestStore(): RequestStore | undefined {
  return storage.getStore();
}

export function setRequestUserId(userId: string | null) {
  const store = storage.getStore();
  if (store) store.userId = userId;
}

export function outgoingHeaders(): Headers {
  return getRequestStore().responseHeaders;
}
