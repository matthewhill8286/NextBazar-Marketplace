import { data } from "react-router";
import {
  outgoingHeaders,
  runWithRequestContext,
  setRequestUserId,
} from "@/lib/request-context";
import { createClient } from "@/lib/supabase/server";
import { asNextRequest } from "./next-server";

export async function withContext<T>(
  request: Request,
  fn: () => Promise<T>,
): Promise<T> {
  return runWithRequestContext(request, async () => {
    const result = await fn();
    const extra = outgoingHeaders();
    if (result instanceof Response) {
      for (const cookie of extra.getSetCookie()) {
        result.headers.append("Set-Cookie", cookie);
      }
      return result;
    }
    if (extra.getSetCookie().length > 0) {
      return data(result as object, { headers: extra }) as T;
    }
    return result;
  });
}

export async function loadSessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = user?.id ?? null;
  setRequestUserId(id);
  return id;
}

type NextHandler = (request: never) => Promise<Response> | Response;

export function resourceFromNext(handlers: {
  GET?: NextHandler;
  POST?: NextHandler;
  PUT?: NextHandler;
  PATCH?: NextHandler;
  DELETE?: NextHandler;
}) {
  async function dispatch(request: Request) {
    const method = request.method.toUpperCase();
    const handler =
      handlers[method as keyof typeof handlers] ??
      (method === "HEAD" ? handlers.GET : undefined);
    if (!handler) {
      return new Response("Method Not Allowed", { status: 405 });
    }
    return withContext(request, async () =>
      handler(asNextRequest(request) as never),
    );
  }

  return {
    loader: ({ request }: { request: Request }) => dispatch(request),
    action: ({ request }: { request: Request }) => dispatch(request),
  };
}
