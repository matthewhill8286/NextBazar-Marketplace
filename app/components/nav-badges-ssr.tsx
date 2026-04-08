import { createClient } from "@/lib/supabase/server";
import NavBadges from "./nav-badges";

/**
 * Server-side wrapper that fetches initial unread counts from the authed
 * Supabase client (via the session cookie) and hands them to the client
 * <NavBadges /> as `initialUnread*` props.
 *
 * This removes the two client-side PostgREST count queries that previously
 * fired on every page load. The client island still mounts realtime
 * subscriptions, so counts stay live after hydration.
 *
 * Wrapped in Suspense at the call site so the rest of the navbar doesn't
 * wait on the auth/count round trips.
 */
export default async function NavBadgesSSR() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ count: msgCount }, { count: nCount }] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", user.id)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  return (
    <NavBadges
      initialUnreadMessages={msgCount ?? 0}
      initialUnreadNotifications={nCount ?? 0}
    />
  );
}
