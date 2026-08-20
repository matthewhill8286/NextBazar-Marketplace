"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import OffersClient from "./offers-client";

/**
 * `useSearchParams()` opts a client component out of static prerendering,
 * so Next.js requires the closest parent to be a <Suspense> boundary —
 * otherwise the route is flagged as "blocking" (E1078).  We split the
 * URL-reading logic into <OffersInner /> and Suspense it here.
 */
export default function OffersPage() {
  return (
    <Suspense fallback={<OffersFallback />}>
      <OffersInner />
    </Suspense>
  );
}

function OffersInner() {
  const searchParams = useSearchParams();
  const focusOfferId = searchParams.get("offer") ?? undefined;
  const initialTab =
    (searchParams.get("tab") as "received" | "sent") ?? undefined;
  const { userId, loading: authLoading } = useAuth();

  useEffect(() => {
    // Auth hook handles loading automatically
  }, [userId]);

  if (authLoading) {
    return <OffersFallback />;
  }

  if (!userId) return null;

  return (
    <OffersClient
      userId={userId}
      focusOfferId={focusOfferId}
      initialTab={initialTab}
    />
  );
}

function OffersFallback() {
  return (
    <div>
      <div className="h-7 w-28 bg-[#e8e6e3] animate-pulse mb-6" />
      <div className="flex gap-1 bg-[#f0eeeb] p-1 mb-6">
        <div className="h-9 flex-1 bg-[#e8e6e3] animate-pulse" />
        <div className="h-9 flex-1 bg-[#e8e6e3] animate-pulse" />
      </div>
      <div className="bg-white border border-[#e8e6e3] divide-y divide-[#faf9f7]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="w-12 h-10 bg-[#e8e6e3] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-[#e8e6e3] animate-pulse" />
              <div className="h-3 w-1/2 bg-[#e8e6e3] animate-pulse" />
            </div>
            <div className="w-16 h-4 bg-[#e8e6e3] animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
