import { Bone, ListingGridSkeleton } from "../loading-skeleton";

export default function SavedLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Bone className="h-7 w-36" />
          <Bone className="h-4 w-24" />
        </div>
      </div>
      <ListingGridSkeleton count={8} />
    </div>
  );
}

function BoneSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-[#e8e6e3] animate-pulse" />
          <div className="h-4 w-24 bg-[#e8e6e3] animate-pulse" />
        </div>
      </div>
      {/* List skeleton */}
      <div className="space-y-px bg-[#e8e6e3]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white flex gap-4 p-4">
            <div className="w-28 h-20 bg-[#e8e6e3] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-3/4 bg-[#e8e6e3] animate-pulse" />
              <div className="h-3 w-1/2 bg-[#e8e6e3] animate-pulse" />
              <div className="h-5 w-20 bg-[#e8e6e3] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
