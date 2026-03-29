import { Bone, CardSkeleton, StatsGridSkeleton } from "../loading-skeleton";

export default function ShopLoading() {
  return (
    <div>
      <Bone className="h-7 w-28 mb-6" />
      <StatsGridSkeleton count={3} />
      <div className="space-y-6">
        {/* Shop info card */}
        <CardSkeleton>
          <div className="flex items-center gap-4 mb-4">
            <Bone className="w-16 h-16 shrink-0" />
            <div className="space-y-2 flex-1">
              <Bone className="h-5 w-40" />
              <Bone className="h-4 w-56" />
            </div>
            <Bone className="h-9 w-20 shrink-0" />
          </div>
        </CardSkeleton>

        {/* Customization */}
        <CardSkeleton>
          <Bone className="h-5 w-36 mb-4" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Bone className="h-3 w-20" />
              <Bone className="h-10 w-full " />
            </div>
            <div className="space-y-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-10 w-full " />
            </div>
            <Bone className="h-32 w-full " />
          </div>
        </CardSkeleton>
      </div>
    </div>
  );
}
