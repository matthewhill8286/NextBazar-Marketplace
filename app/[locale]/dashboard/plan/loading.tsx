import { Bone, CardSkeleton } from "../loading-skeleton";

export default function PlanLoading() {
  return (
    <div>
      <Bone className="h-7 w-44 mb-2" />
      <Bone className="h-4 w-72 mb-8" />

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i}>
            <div className="flex items-center gap-2 mb-4">
              <Bone className="w-8 h-8 shrink-0" />
              <Bone className="h-5 w-24" />
            </div>
            <Bone className="h-8 w-32 mb-1" />
            <Bone className="h-3 w-20 mb-6" />
            {/* Feature list skeleton */}
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Bone className="w-4 h-4 shrink-0" />
                  <Bone className="h-3 w-full" />
                </div>
              ))}
            </div>
            <Bone className="h-11 w-full mt-6" />
          </CardSkeleton>
        ))}
      </div>
    </div>
  );
}
