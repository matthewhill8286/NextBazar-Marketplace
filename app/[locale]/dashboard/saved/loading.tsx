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
