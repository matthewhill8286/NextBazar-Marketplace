import {
  Bone,
  HeaderSkeleton,
  ListRowSkeleton,
  StatsGridSkeleton,
} from "../loading-skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <HeaderSkeleton />
        <Bone className="h-10 w-32 hidden sm:block" />
      </div>

      <StatsGridSkeleton count={3} />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="space-y-2">
          <Bone className="h-3 w-24 mb-3" />
          <ListRowSkeleton count={4} />
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#e8e6e3] p-4 flex items-center gap-3">
            <Bone className="w-14 h-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-48" />
              <Bone className="h-4 w-16 rounded-full" />
            </div>
          </div>

          <StatsGridSkeleton count={3} />

          <div className="bg-white border border-[#e8e6e3] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Bone className="h-4 w-20" />
              <Bone className="h-7 w-28 " />
            </div>
            <Bone className="h-24 w-full " />
          </div>
        </div>
      </div>
    </div>
  );
}
