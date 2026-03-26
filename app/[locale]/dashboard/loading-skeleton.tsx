/** Shared skeleton primitives for dashboard loading states. */
export function Bone({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

/** Header with title and optional subtitle. */
export function HeaderSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="space-y-2 mb-6">
      <Bone className="h-7 w-40" />
      {subtitle && <Bone className="h-4 w-56" />}
    </div>
  );
}

/** Standard card wrapper. */
export function CardSkeleton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** Row item with thumbnail + text lines. */
export function ListRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`list-row-${i}`} className="flex items-center gap-3 p-4">
          <Bone className="w-12 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="w-16 h-4 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Stats grid — small metric cards. */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={`grid gap-3 mb-6 ${count <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`stats-grid-${i}`}
          className="bg-white rounded-xl border border-gray-100 p-4 space-y-2"
        >
          <Bone className="h-3 w-16" />
          <Bone className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Tab bar skeleton. */
export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <Bone key={`tab-${i}`} className="h-9 flex-1 rounded-lg" />
      ))}
    </div>
  );
}

/** Grid of listing cards. */
export function ListingGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`listing-grid-${i}`}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          <Bone className="h-40 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
            <Bone className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
