import { Bone, StatsGridSkeleton } from "../loading-skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-32" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-32 rounded-xl hidden sm:block" />
      </div>

      <StatsGridSkeleton count={3} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Left — listing list */}
        <div className="space-y-2">
          <Bone className="h-3 w-24 mb-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white"
            >
              <Bone className="w-11 h-11 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="w-24 h-8" />
            </div>
          ))}
        </div>

        {/* Right — detail */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <Bone className="w-14 h-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-48" />
              <Bone className="h-4 w-16 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-100 bg-white space-y-2"
              >
                <Bone className="w-8 h-8 rounded-lg" />
                <Bone className="h-7 w-16" />
                <Bone className="h-3 w-20" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Bone className="h-4 w-20" />
              <Bone className="h-7 w-28 rounded-lg" />
            </div>
            <Bone className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
