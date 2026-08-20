import { getRequestStore, tryGetRequestStore } from "@/lib/request-context";
import { createClient } from "@/lib/supabase/server";

export async function getUserId(): Promise<string | null> {
  const store = tryGetRequestStore();
  if (store?.userId) return store.userId;

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
  response: Response;
};

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const userId = await getUserId();

  if (!userId) {
    return {
      error: "Unauthorized",
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { userId };
}

export { getRequestStore };
