import { Bone, HeaderSkeleton, StatsGridSkeleton, TabsSkeleton, ListRowSkeleton } from "./loading-skeleton";

/** Overview page loading skeleton. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <HeaderSkeleton />
        <Bone className="h-10 w-32 rounded-xl" />
      </div>

      <StatsGridSkeleton count={4} />

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Bone className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-48" />
            <Bone className="h-3 w-64" />
          </div>
          <Bone className="w-24 h-9 rounded-lg shrink-0" />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <Bone className="h-5 w-28" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
        <TabsSkeleton count={4} />
        <ListRowSkeleton count={5} />
      </div>
    </div>
  );
}
