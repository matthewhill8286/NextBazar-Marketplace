import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/require-auth";
import { ipKey, limit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Guard for every /api/ai/* route.
 *
 * - Requires an authenticated user (prevents anonymous credit-burn).
 * - Applies a per-user rate limit appropriate to AI calls.
 * - Short-circuits with a 503 if OPENAI_API_KEY isn't set so downstream code
 *   can assume the provider is configured.
 *
 * Returns `{ userId }` on success or `{ response }` with a ready-made
 * NextResponse for all failure modes.
 */
export async function guardAi(
  request: Request,
  opts: { bucket: string; max?: number; windowMs?: number } = {
    bucket: "ai",
    max: 20,
    windowMs: 60_000,
  },
): Promise<
  { userId: string; response?: never } | { userId?: never; response: Response }
> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      response: NextResponse.json(
        { error: "AI features are not configured. Please set OPENAI_API_KEY." },
        { status: 503 },
      ),
    };
  }

  const userId = await getUserId();
  if (!userId) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { bucket, max = 20, windowMs = 60_000 } = opts;
  const byUser = await limit(`ai:${bucket}:u:${userId}`, { max, windowMs });
  if (!byUser.success) return { response: tooManyRequests(byUser) };

  // Belt-and-braces: also cap per-IP in case a single user proxies traffic.
  const byIp = await limit(`ai:${bucket}:ip:${ipKey(request)}`, {
    max: Math.max(max * 2, 40),
    windowMs,
  });
  if (!byIp.success) return { response: tooManyRequests(byIp) };

  return { userId };
}
