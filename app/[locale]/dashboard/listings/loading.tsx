import { Bone, ListRowSkeleton, TabsSkeleton } from "../loading-skeleton";

export default function ListingsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Bone className="h-7 w-36" />
        <Bone className="h-10 w-32 rounded-xl" />
      </div>
      <TabsSkeleton count={4} />
      <ListRowSkeleton count={6} />
    </div>
  );
}
