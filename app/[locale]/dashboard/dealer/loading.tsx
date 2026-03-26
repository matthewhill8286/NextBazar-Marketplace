import { Bone, CardSkeleton, StatsGridSkeleton } from "../loading-skeleton";

export default function DealerLoading() {
  return (
    <div>
      <Bone className="h-7 w-32 mb-6" />
      <StatsGridSkeleton count={4} />
      <CardSkeleton>
        <div className="space-y-4">
          <Bone className="h-5 w-40" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
          <Bone className="h-11 w-40 rounded-xl" />
        </div>
      </CardSkeleton>
    </div>
  );
}
