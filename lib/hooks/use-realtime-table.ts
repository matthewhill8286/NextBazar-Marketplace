import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type AnyRecord = Record<string, any>;

export type RealtimePayload<T extends AnyRecord = AnyRecord> = {
  /** Populated on INSERT and UPDATE events. */
  new: Partial<T>;
  /** Populated on DELETE and UPDATE events (requires REPLICA IDENTITY FULL for UPDATE). */
  old: Partial<T>;
};

type Options<T extends AnyRecord> = {
  /**
   * Unique channel name. Include entity IDs to avoid collisions between
   * multiple instances of the same component, e.g. `chat-${conversationId}-insert`.
   */
  channelName: string;
  /** Supabase table name. */
  table: string;
  /** Postgres event to listen for. */
  event: RealtimeEvent;
  /**
   * Optional server-side row filter, e.g. `"user_id=eq.abc123"`.
   * Note: UPDATE filters on columns that are not part of the changeset are
   * silently dropped by Supabase — filter client-side when unsure.
   */
  filter?: string;
  /** Postgres schema (defaults to "public"). */
  schema?: string;
  /**
   * Handler invoked for each matching event.
   * May be async — the hook does not await it.
   * Kept in a ref internally, so it never causes a re-subscribe.
   */
  onPayload: (payload: RealtimePayload<T>) => void | Promise<void>;
  /**
   * Set to `false` to skip subscribing (e.g. while `userId` is still null).
   * Defaults to `true`.
   */
  enabled?: boolean;
};

/**
 * Generic Supabase real-time postgres_changes subscription hook.
 *
 * Centralizes the channel creation / cleanup boilerplate and keeps the
 * callback in a ref, so updates to handler logic never trigger a re-subscribe.
 *
 * @example
 * useRealtimeTable({
 *   channelName: `notifs-${userId}`,
 *   table: "notifications",
 *   event: "INSERT",
 *   filter: `user_id=eq.${userId}`,
 *   onPayload: ({ new: notif }) => toast(notif.title),
 *   enabled: !!userId,
 * });
 */
export function useRealtimeTable<T extends AnyRecord = AnyRecord>({
  channelName,
  table,
  event,
  filter,
  schema = "public",
  onPayload,
  enabled = true,
}: Options<T>): void {
  // Keep the latest callback in a ref so changes to it never cause a re-subscription.
  const callbackRef = useRef(onPayload);
  useEffect(() => {
    callbackRef.current = onPayload;
  });

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    // Build the filter config — omit the `filter` key when not provided so
    // Supabase doesn't interpret an empty string as a filter expression.
    const listenConfig: {
      event: RealtimeEvent;
      schema: string;
      table: string;
      filter?: string;
    } = { event, schema, table };
    if (filter) listenConfig.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        listenConfig,
        (payload: { new: unknown; old: unknown }) => {
          callbackRef.current({
            new: (payload.new ?? {}) as Partial<T>,
            old: (payload.old ?? {}) as Partial<T>,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Re-subscribe only when the subscription itself changes, not when the callback changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, event, filter, schema, enabled]);
}
