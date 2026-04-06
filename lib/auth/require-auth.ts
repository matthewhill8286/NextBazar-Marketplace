import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Read the authenticated user's UUID from the middleware-injected header.
 *
 * The middleware (`proxy.ts`) calls `supabase.auth.getUser()` once for every
 * request and writes `x-user-id` into the request headers.  API routes and
 * server components can read it here **without** making a second round-trip
 * to the Supabase Auth service.
 *
 * Falls back to `getUser()` only when the header is missing (e.g. in tests
 * or non-standard request flows).
 */
export async function getUserId(): Promise<string | null> {
  const h = await headers();
  const fromHeader = h.get("x-user-id");
  if (fromHeader) return fromHeader;

  // Fallback — should rarely happen in production
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

type AuthSuccess = { userId: string; error?: never; response?: never };
type AuthFailure = {
  userId?: never;
  error: string;
  response: NextResponse;
};

/**
 * Convenience wrapper for API route handlers.
 *
 * Returns the authenticated user ID or a ready-made 401 response.
 *
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const auth = await requireAuth();
 *   if (auth.response) return auth.response;
 *   const { userId } = auth;
 *   // …
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const userId = await getUserId();

  if (!userId) {
    return {
      error: "Unauthorized",
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId };
}
