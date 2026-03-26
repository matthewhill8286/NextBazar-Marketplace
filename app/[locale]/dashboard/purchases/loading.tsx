import { Bone, TabsSkeleton, ListRowSkeleton } from "../loading-skeleton";

export default function PurchasesLoading() {
  return (
    <div>
      <Bone className="h-7 w-32 mb-6" />
      <TabsSkeleton count={3} />
      <ListRowSkeleton count={5} />
    </div>
  );
}
