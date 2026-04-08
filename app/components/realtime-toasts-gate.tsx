"use client";

import dynamic from "next/dynamic";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

/**
 * Tiny gatekeeper around the real <RealtimeToasts /> implementation.
 *
 * Why a separate file?
 *  1. The actual <RealtimeToasts /> weighs ~700 lines, pulls in 5 Supabase
 *     realtime channels, lucide icons, sonner, and a bunch of custom toast
 *     UIs. We don't want any of that code in the initial client bundle.
 *  2. Anonymous visitors (the vast majority of landing-page traffic) never
 *     need it at all, so we also gate on `userId` and avoid opening realtime
 *     WebSockets entirely for logged-out users.
 *
 * next/dynamic with `ssr: false` means the heavy module is only requested
 * after hydration, and only when we actually decide to render it.
 */
const RealtimeToastsInner = dynamic(() => import("./realtime-toasts"), {
  ssr: false,
  loading: () => null,
});

export default function RealtimeToastsGate() {
  const { userId } = useCurrentUser();
  if (!userId) return null;
  return <RealtimeToastsInner />;
}
