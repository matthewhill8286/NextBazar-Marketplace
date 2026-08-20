import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import { tryGetRequestStore } from "@/lib/request-context";

function env(name: string): string {
  return process.env[name] ?? "";
}

export async function createClient() {
  const store = tryGetRequestStore();
  const cookieHeader = store?.request.headers.get("Cookie") ?? "";
  const responseHeaders = store?.responseHeaders;

  return createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL") || env("VITE_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY") || env("VITE_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader).map((cookie) => ({
            name: cookie.name,
            value: cookie.value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          if (!responseHeaders) return;
          for (const { name, value, options } of cookiesToSet) {
            responseHeaders.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          }
        },
      },
    },
  );
}
