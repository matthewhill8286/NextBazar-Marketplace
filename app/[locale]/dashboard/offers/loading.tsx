import { Bone, ListRowSkeleton, TabsSkeleton } from "../loading-skeleton";

export default function OffersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Bone className="h-7 w-28 mb-6" />
      <TabsSkeleton count={2} />
      <ListRowSkeleton count={5} />
    </div>
  );
}
